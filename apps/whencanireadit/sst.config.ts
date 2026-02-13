import type {} from "./.sst/platform/config.d.ts";

export default $config({
  app(input) {
    return {
      name: "whencanireadit",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
      providers: {
        aws: {
          region: "us-east-1",
          profile: "sst-production"
        },
      },
    };
  },
  async run() {
    const certificateArn = process.env.ACM_CERTIFICATE_ARN
      ?? "arn:aws:acm:us-east-1:632700996244:certificate/0dbc1389-0710-41fa-bdfb-e5ce01ea68a2";

    const site = new sst.aws.Nextjs("WhenCanIReadIt", {
      server: {
        runtime: 'nodejs22.x',
        architecture: 'arm64',
      },
      domain: {
        name: "www.whencanireadit.com",
        aliases: ["whencanireadit.com"],
        cert: certificateArn,
        dns: false
      },
      environment: {
        GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY!,
        NYT_BOOKS_API_KEY: process.env.NYT_BOOKS_API_KEY!,
      },
      transform: {
        cdn: (args) => {
          args.orderedCacheBehaviors = [
            // Bestsellers API - cache aggressively (updated weekly)
            {
              pathPattern: "/api/books/bestsellers*",
              targetOriginId: args.defaultCacheBehavior.targetOriginId,
              viewerProtocolPolicy: "redirect-to-https",
              allowedMethods: ["GET", "HEAD", "OPTIONS"],
              cachedMethods: ["GET", "HEAD"],
              compress: true,
              forwardedValues: {
                queryString: true,
                headers: ["Accept", "Accept-Encoding"],
                cookies: { forward: "none" },
              },
              minTtl: 3600, // 1 hour minimum
              defaultTtl: 86400, // 24 hours default
              maxTtl: 86400, // 24 hours maximum
            },
            // Search API - cache lightly
            {
              pathPattern: "/api/search",
              targetOriginId: args.defaultCacheBehavior.targetOriginId,
              viewerProtocolPolicy: "redirect-to-https",
              allowedMethods: ["GET", "HEAD", "OPTIONS"],
              cachedMethods: ["GET", "HEAD"],
              compress: true,
              forwardedValues: {
                queryString: true,
                headers: ["Accept", "Accept-Encoding"],
                cookies: { forward: "none" },
              },
              minTtl: 600, // 10 minutes minimum
              defaultTtl: 3600, // 1 hour default
              maxTtl: 3600, // 1 hour maximum
            },
          ];
        },
      },
    });

    const nodes = site.nodes as {
      server?: { name: string };
      imageOptimizer?: { name: string };
    };

    const addPublicUrlPermissions = (idPrefix: string, functionName: string) => {
      new aws.lambda.Permission(`${idPrefix}UrlPermission`, {
        action: "lambda:InvokeFunctionUrl",
        function: functionName,
        principal: "*",
        functionUrlAuthType: "NONE",
      });
      new aws.lambda.Permission(`${idPrefix}InvokePermission`, {
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
