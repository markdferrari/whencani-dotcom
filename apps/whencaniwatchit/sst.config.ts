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
    const certificateArn =
      process.env.ACM_CERTIFICATE_ARN ??
      "arn:aws:acm:us-east-1:632700996244:certificate/d3deeb5a-33dc-4b3b-8f82-4598dad5220b";
    const zoneId = process.env.ROUTE53_ZONE_ID ?? "Z02296993P8NWPQQZY8WO";

    // Define secrets using SST Secret resource
    // These are stored securely in AWS SSM Parameter Store
    // Set them with: sst secret set TMDB_API_KEY <value>
    const tmdbApiKey = new sst.Secret("TmdbApiKey");

    const site = new sst.aws.Nextjs("WhenCanIWatchIt", {
      server: {
        runtime: 'nodejs22.x',
        architecture: 'arm64',
      },
      domain: {
        name: "www.whencaniwatchit.com",
        aliases: ["whencaniwatchit.com"],
        dns: sst.aws.dns({
          zone: zoneId,
        }),
        cert: certificateArn,
      },
      environment: {
        TMDB_API_KEY: tmdbApiKey.value,
      },
      link: [tmdbApiKey],
      transform: {
        cdn: (args) => {
          // Add cache policy for API routes
          args.orderedCacheBehavior = [
            ...(args.orderedCacheBehavior ?? []),
            // TMDB API routes - cache moderately (1 hour)
            {
              pathPattern: "/api/tmdb/*",
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
              minTtl: 1800, // 30 minutes minimum
              defaultTtl: 3600, // 1 hour default
              maxTtl: 7200, // 2 hours maximum
            },
            // Geocoding API - cache for 7 days (very stable data)
            {
              pathPattern: "/api/geocode",
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
              defaultTtl: 604800, // 7 days default
              maxTtl: 604800, // 7 days maximum
            },
            // Nearby cinemas - cache for 24 hours
            {
              pathPattern: "/api/cinemas/nearby",
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
              minTtl: 3600, // 1 hour minimum
              defaultTtl: 86400, // 24 hours default
              maxTtl: 86400, // 24 hours maximum
            },
          ];
        },
      },
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
