import type {} from "./.sst/platform/config.d.ts";

export default $config({
  app(input) {
    return {
      name: "whencaniwatchit",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
          profile: "sst-production",
        },
      },
    };
  },
  async run() {
    const googleClientId = new sst.Secret("GoogleClientId");
    const googleClientSecret = new sst.Secret("GoogleClientSecret");
    const vapidPublicKey = new sst.Secret("VapidPublicKey");
    const vapidPrivateKey = new sst.Secret("VapidPrivateKey");
    const vapidSubject = new sst.Secret("VapidSubject");

    // DynamoDB table for push notification reminders
    const notificationsTable = new sst.aws.Dynamo("NotificationsTable", {
      fields: {
        pk: "string",
        sk: "string",
        gsi1pk: "string",
        gsi1sk: "string",
      },
      primaryIndex: { hashKey: "pk", rangeKey: "sk" },
      globalIndexes: {
        gsi1: { hashKey: "gsi1pk", rangeKey: "gsi1sk" },
      },
    });

    // Cron job to send due push notifications daily at 09:00 UTC
    new sst.aws.Cron("SendNotificationsCron", {
      schedule: "cron(0 9 * * ? *)",
      function: {
        handler: "lib/send-notifications.handler",
        runtime: "nodejs22.x",
        architecture: "arm64",
        timeout: "5 minutes",
        link: [notificationsTable],
        environment: {
          NOTIFICATIONS_TABLE_NAME: notificationsTable.name,
          VAPID_PUBLIC_KEY: vapidPublicKey.value,
          VAPID_PRIVATE_KEY: vapidPrivateKey.value,
          VAPID_SUBJECT: vapidSubject.value,
        },
      },
    });
    
    const certificateArn =
      process.env.ACM_CERTIFICATE_ARN ??
      "arn:aws:acm:us-east-1:632700996244:certificate/d3deeb5a-33dc-4b3b-8f82-4598dad5220b";

    const site = new sst.aws.Nextjs("WhenCanIWatchIt", {
      server: {
        runtime: 'nodejs22.x',
        architecture: 'arm64',
      },
      domain: {
        name: "www.whencaniwatchit.com",
        aliases: ["whencaniwatchit.com"],
        cert: certificateArn,
        dns: false
      },
      environment: {
        TMDB_API_KEY: process.env.TMDB_API_KEY!,        
        GOOGLE_CLIENT_ID: googleClientId.value,
        GOOGLE_CLIENT_SECRET: googleClientSecret.value,
        NEXT_PUBLIC_VAPID_PUBLIC_KEY: vapidPublicKey.value,
        VAPID_PRIVATE_KEY: vapidPrivateKey.value,
        VAPID_SUBJECT: vapidSubject.value,
        NOTIFICATIONS_TABLE_NAME: notificationsTable.name,
      },
      permissions: [
        {
          actions: ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:Query", "dynamodb:DeleteItem", "dynamodb:Scan"],
          resources: [notificationsTable.nodes.table.arn, $interpolate`${notificationsTable.nodes.table.arn}/index/*`],
        },
      ],
      // Cache behavior is handled by the default CloudFront behavior,
      // which respects Cache-Control headers set by route handlers.
    });

    const nodes = site.nodes as {
      server?: { name: string };
      imageOptimizer?: { name: string };
    };

    const addPublicUrlPermissions = (
      idPrefix: string,
      functionName: string,
    ) => {
      new aws.lambda.Permission(`${idPrefix}UrlPerm`, {
        action: "lambda:InvokeFunctionUrl",
        function: functionName,
        principal: "*",
        functionUrlAuthType: "NONE",
      });
      new aws.lambda.Permission(`${idPrefix}InvokePerm`, {
        action: "lambda:InvokeFunction",
        function: functionName,
        principal: "*",
      });
    };

    if (nodes.server) {
      addPublicUrlPermissions("Server", nodes.server.name);
    }

    if (nodes.imageOptimizer) {
      addPublicUrlPermissions("Image", nodes.imageOptimizer.name);
    }
  },
});
