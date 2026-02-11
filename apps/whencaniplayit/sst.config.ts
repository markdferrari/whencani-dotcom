import type {} from "./.sst/platform/config.d.ts";

export default $config({
  app(input) {
    return {
      name: "whencaniplayit",
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
    const certificateArn = "arn:aws:acm:us-east-1:632700996244:certificate/15b3fa06-9db9-440e-8164-f8cd8b910efc"
    const zoneId = "Z01083643VX0XZEEC21MK"

    const site = new sst.aws.Nextjs("WhenCanPlayIt", {
      server: {
        runtime: 'nodejs22.x',
        architecture: 'arm64',
      },
      domain: {
        name: "www.whencaniplayit.com",
        aliases: ["whencaniplayit.com"],
        dns: sst.aws.dns({
          zone: zoneId,
        }),
        cert: certificateArn,
      },
      environment: {
        IGDB_CLIENT_ID: process.env.IGDB_CLIENT_ID!,
        IGDB_CLIENT_SECRET: process.env.IGDB_CLIENT_SECRET!,
        RAPID_API_KEY: process.env.RAPID_API_KEY!,
      },
      transform: {
        cdn: (args) => {
          // Add cache policy for API routes
          args.orderedCacheBehavior = [
            ...(args.orderedCacheBehavior ?? []),
            // OpenCritic API routes - cache aggressively (48 hours)
            {
              pathPattern: "/api/opencritic/*",
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
              maxTtl: 172800, // 48 hours maximum
            },
            // IGDB API routes - cache moderately (24 hours)
            {
              pathPattern: "/api/igdb/*",
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
            // Image proxy - cache aggressively
            {
              pathPattern: "/api/image",
              targetOriginId: args.defaultCacheBehavior.targetOriginId,
              viewerProtocolPolicy: "redirect-to-https",
              allowedMethods: ["GET", "HEAD"],
              cachedMethods: ["GET", "HEAD"],
              compress: true,
              forwardedValues: {
                queryString: true,
                headers: [],
                cookies: { forward: "none" },
              },
              minTtl: 86400, // 24 hours minimum
              defaultTtl: 86400, // 24 hours default
              maxTtl: 604800, // 7 days maximum
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
