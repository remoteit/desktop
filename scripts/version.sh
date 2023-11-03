#!/bin/sh

increment_version_number() {
  echo $(( $1 + 1 ))
}

sanitize_version_string() {
  # This will match the first occurrence of a semantic versioning pattern and discard suffixes
  echo "$1" | sed -E 's/^([0-9]+(\.[0-9]+)*).*/\1/'
}

update_ios_version() {
  pbxprojFile="ios/App/Remote.It.xcodeproj/project.pbxproj"
  sanitizedVersion=$(sanitize_version_string "$1")

  # Update the marketing version
  sed -i '' "s/MARKETING_VERSION = \".*\";/MARKETING_VERSION = \"$sanitizedVersion\";/" "$pbxprojFile"

  # Increment the build number
  buildNumber=$(grep -m1 -E 'CURRENT_PROJECT_VERSION = [0-9]+;' "$pbxprojFile" | awk -F ' = ' '{print $2}' | tr -d ';')
  newBuildNumber=$((buildNumber + 1))
  sed -i '' "s/CURRENT_PROJECT_VERSION = $buildNumber;/CURRENT_PROJECT_VERSION = $newBuildNumber;/" "$pbxprojFile"
}

update_android_version() {
  gradleFile="android/app/build.gradle"
  sanitizedVersion=$(sanitize_version_string "$1")
  
  # Update the versionName
  sed -i "" "s/versionName \".*\"/versionName \"$sanitizedVersion\"/" $gradleFile
  
  # Increment the versionCode
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

# Update the Android version
update_android_version $1

# Install dependencies and add the changes
npm i --legacy-peer-deps
npm install
git add --all

set +x
