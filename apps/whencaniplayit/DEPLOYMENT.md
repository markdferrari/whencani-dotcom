# SST Deployment Guide

## Prerequisites

1. **AWS Credentials**: Ensure AWS profile `markdferrari` is configured
2. **Terraform**: Route53 zone and ACM certificate must be created first
3. **Environment Variables**: Set in `.env.local` for local dev

## Infrastructure Setup (Terraform)

### 1. Initialize and Apply Terraform

```bash
cd iac
terraform init
terraform apply
```

This creates:
- Route53 hosted zone for `whencaniplayit.com`
- ACM certificate for SSL (with DNS validation)
- DNS validation records

### 2. Get Certificate ARN

```bash
cd iac
terraform output certificate_arn
```

Copy this value - you'll need it for SST deployment.

### 3. Update DNS Nameservers

Get the nameservers from Terraform:

```bash
terraform output nameservers
```

Update your domain registrar to use these Route53 nameservers.

## SST Deployment

### Environment Variables

Create a `.env` file in the project root with:

```bash
CERTIFICATE_ARN=arn:aws:acm:eu-west-1:... # From terraform output
IGDB_CLIENT_ID=your_client_id
IGDB_CLIENT_SECRET=your_client_secret
RAPID_API_KEY=your_rapidapi_key
```

**Required Variables:**
- **IGDB_CLIENT_ID** / **IGDB_CLIENT_SECRET**: Twitch OAuth credentials for IGDB API
- **RAPID_API_KEY**: RapidAPI key for OpenCritic API (required for Latest Reviews and Trending features)

### Deploy to Production

```bash
# Deploy the application
yarn sst:deploy

# Or with npm
npm run sst:deploy
```

This will:
1. Build the Next.js application
2. Create AWS resources (CloudFront, Lambda, S3)
3. Configure SSL with the ACM certificate
4. Set up domain routing

### Development Mode

For local development with SST:

```bash
yarn sst:dev
```

This runs SST in development mode, which:
- Deploys to a `dev` stage in AWS
- Enables live Lambda function updates
- Provides faster iteration

### Remove Deployment

To tear down the SST infrastructure:

```bash
yarn sst:remove
```

⚠️ **Note**: This only removes SST resources. Terraform-managed resources (Route53, ACM) remain intact.

## Architecture

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ CloudFront  │ ← SSL Certificate (ACM)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Lambda@Edge │ ← Next.js Server
└──────┬──────┘
       │
       ▼
┌─────────────┐
│     S3      │ ← Static Assets
└─────────────┘
```

## Cost Estimates

- **Route53**: $0.50/month (hosted zone)
- **ACM**: Free
- **CloudFront**: ~$0.085/GB + $0.01/10k requests
- **Lambda**: First 1M requests free, then $0.20/1M
- **S3**: ~$0.023/GB storage

**Total estimated**: $1-5/month for low-medium traffic

## Troubleshooting

### Certificate Validation Pending

If the ACM certificate is stuck in "Pending Validation":
1. Ensure nameservers are updated at your registrar
2. DNS propagation can take up to 48 hours
3. Check validation records: `dig _acm-challenge.whencaniplayit.com`

### SST Deployment Fails

Common issues:
- **AWS credentials**: Verify `AWS_PROFILE=markdferrari` or profile in config
- **Certificate ARN**: Must be in `us-east-1` for CloudFront (SST handles this)
- **Environment variables**: Ensure `.env` file exists with required vars

### Domain Not Working

1. Verify CloudFront distribution is deployed
2. Check Route53 A record points to CloudFront
3. Wait for DNS propagation (up to 48 hours)
4. Test with: `dig whencaniplayit.com`

## Next Steps

After successful deployment:
1. ✅ Verify site is accessible at https://whencaniplayit.com
2. 📝 Add www redirect if needed
3. 🔒 Review CloudFront security headers
4. 📊 Set up monitoring (CloudWatch, error tracking)
5. 💾 Consider migrating notes to S3 for production use
