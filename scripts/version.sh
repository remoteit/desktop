#!/bin/sh

increment_version_number() {
  echo $(( $1 + 1 ))
}

update_ios_version() {
  echo "Updating iOS version..."
  cd ios/App
  agvtool new-marketing-version $1
  # Increment the build number
  buildNumber=$(agvtool what-version | grep -Eo '[0-9]+')
  newBuildNumber=$(increment_version_number $buildNumber)
  agvtool new-version -all $newBuildNumber
}

update_android_version() {
  echo "Updating Android version..."
  gradleFile="android/app/build.gradle"
  sed -i "" "s/versionName \".*\"/versionName \"$1\"/" $gradleFile
  # Increment the versionCode by one
  versionCode=$(grep versionCode $gradleFile | awk '{print $2}')
  newVersionCode=$(increment_version_number $versionCode)
  sed -i "" "s/versionCode .*/versionCode $newVersionCode/" $gradleFile
}

set -x

# Update the frontend version
cd frontend
npm version $1 --no-git-tag-version
cd ../

# Update the backend version
cd backend
npm version $1 --no-git-tag-version
cd ../

# Update the iOS version
update_ios_version $1
cd ../../

# Update the Android version
update_android_version $1

# Install dependencies and commit the changes
npm i --legacy-peer-deps
npm install
git add --all

set +x
