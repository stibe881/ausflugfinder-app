
echo "Cleaning Expo Cache..."
rm -rf .expo
rm -rf node_modules/.cache/babel-loader
npx expo start --clear
