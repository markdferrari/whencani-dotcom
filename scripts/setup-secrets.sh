#!/bin/bash
# Setup SST Secrets - Run this once to set up production secrets

set -e

echo "🔐 SST Secrets Setup Script"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
  echo "❌ Error: Run this script from the repository root"
  exit 1
fi

# Function to ensure dependencies are installed
ensure_dependencies() {
  local app_dir=$1
  if [ ! -d "$app_dir/node_modules" ]; then
    echo "📦 Installing dependencies in $app_dir..."
    cd "$app_dir"
    yarn install
    cd - > /dev/null
    echo "✅ Dependencies installed"
  fi
}

# Function to prompt for secret
prompt_secret() {
  local secret_name=$1
  local description=$2
  local app_dir=$3

  echo ""
  echo "Setting: $secret_name"
  echo "Description: $description"
  read -sp "Enter value (input hidden): " secret_value
  echo ""

  if [ -z "$secret_value" ]; then
    echo "⚠️  Skipping $secret_name (empty value)"
    return
  fi

  cd "$app_dir"
  yarn sst secret set "$secret_name" "$secret_value"
  cd - > /dev/null
  echo "✅ $secret_name set successfully"
}

# Function to generate random secret
generate_secret() {
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
}

echo "Which app do you want to configure?"
echo "1) whencaniplayit"
echo "2) whencaniwatchit"
echo "3) Both"
read -p "Enter choice (1-3): " choice

case $choice in
  1|3)
    echo ""
    echo "📱 Configuring whencaniplayit..."
    echo "================================"

    ensure_dependencies "apps/whencaniplayit"

    prompt_secret "IgdbClientId" "IGDB API Client ID" "apps/whencaniplayit"
    prompt_secret "IgdbClientSecret" "IGDB API Client Secret" "apps/whencaniplayit"
    prompt_secret "RapidApiKey" "RapidAPI Key for OpenCritic" "apps/whencaniplayit"

    echo ""
    read -p "Generate a new RevalidateSecret? (y/n): " gen_secret
    if [ "$gen_secret" = "y" ] || [ "$gen_secret" = "Y" ]; then
      generated=$(generate_secret)
      echo "Generated secret: $generated"
      cd "apps/whencaniplayit"
      yarn sst secret set "RevalidateSecret" "$generated"
      cd - > /dev/null
      echo "✅ RevalidateSecret set successfully"
      echo ""
      echo "⚠️  IMPORTANT: Copy this secret to GitHub Actions:"
      echo "   1. Go to Settings → Secrets and variables → Actions"
      echo "   2. Add/Update secret: REVALIDATE_SECRET"
      echo "   3. Value: $generated"
      echo ""
    else
      prompt_secret "RevalidateSecret" "Cache Revalidation Secret" "apps/whencaniplayit"
    fi
    ;&  # Fall through to case 2 if choice was 3

  2)
    if [ "$choice" = "2" ]; then
      echo ""
      echo "🎬 Configuring whencaniwatchit..."
      echo "================================="
    fi

    if [ "$choice" = "3" ]; then
      echo ""
      echo ""
      echo "🎬 Configuring whencaniwatchit..."
      echo "================================="
    fi

    if [ "$choice" = "2" ] || [ "$choice" = "3" ]; then
      ensure_dependencies "apps/whencaniwatchit"
      prompt_secret "TmdbApiKey" "The Movie Database API Key" "apps/whencaniwatchit"
    fi
    ;;

  *)
    echo "❌ Invalid choice"
    exit 1
    ;;
esac

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Verify secrets: cd apps/[app-name] && yarn sst secret list"
echo "2. Deploy: cd apps/[app-name] && yarn sst deploy"
echo "3. No more manual exports needed! 🎉"
