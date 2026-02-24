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
      },
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
