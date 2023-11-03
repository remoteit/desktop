#!/bin/sh

update_ios_version() {
  echo "Updating iOS version..."
  cd ios/App
  # Use agvtool to update the version and build number
  agvtool new-marketing-version $1
  agvtool new-version -all $1
}

update_android_version() {
  echo "Updating Android version..."
  gradleFile="android/app/build.gradle"
  # Use a simple sed command to replace the versionName and versionCode
  sed -i "" "s/versionName \".*\"/versionName \"$1\"/" $gradleFile
  # Increase versionCode by one. This is a placeholder for whatever logic you need to increment the versionCode.
  versionCode=$(grep versionCode $gradleFile | awk '{print $2}')
  let "newVersionCode = $versionCode + 1"
  sed -i "" "s/versionCode .*/versionCode $newVersionCode/" $gradleFile
}

set -x

# Update the frontend version
cd frontend
npm version $1
cd ../

# Update the backend version
cd backend
npm version $1
cd ../

# Update the iOS version
update_ios_version $1
cd ../../

# Update the Android version
update_android_version $1

# Commit the changes
npm i --legacy-peer-deps
npm install
git add --all

set +x
