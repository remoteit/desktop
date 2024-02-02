#!/bin/sh

error() {
  echo "[Error]: $1" >&2
  exit 1
}

increment_version_number() {
  echo $(( $1 + 1 ))
}

sanitize_version_string() {
  echo "$1" | sed -E 's/^([0-9]+(\.[0-9]+)*).*/\1/'
}

update_ios_version() {
  pbxprojFile="ios/App/App.xcodeproj/project.pbxproj"
  sanitizedVersion=$(sanitize_version_string "$1")

  sed -i '' "s/MARKETING_VERSION = [^;]*;/MARKETING_VERSION = $sanitizedVersion;/" "$pbxprojFile" || error "Failed to update iOS marketing version"
  echo "iOS MARKETING_VERSION updated to $sanitizedVersion"

  buildNumber=$(grep -m1 -E 'CURRENT_PROJECT_VERSION = [0-9]+;' "$pbxprojFile" | awk -F ' = ' '{print $2}' | tr -d ';') || error "Failed to read iOS build number"
  newBuildNumber=$((buildNumber + 1))
  sed -i '' "s/CURRENT_PROJECT_VERSION = $buildNumber;/CURRENT_PROJECT_VERSION = $newBuildNumber;/" "$pbxprojFile" || error "Failed to update iOS build number"
  echo "iOS CURRENT_PROJECT_VERSION updated to $newBuildNumber"
}

update_android_version() {
  gradleFile="android/app/build.gradle"
  sanitizedVersion=$(sanitize_version_string "$1")

  sed -i "" "s/versionName \".*\"/versionName \"$sanitizedVersion\"/" $gradleFile || error "Failed to update Android versionName"
  echo "Android versionName updated to $sanitizedVersion"
  
  versionCode=$(grep versionCode $gradleFile | awk '{print $2}') || error "Failed to read Android versionCode"
  newVersionCode=$(increment_version_number $versionCode)
  sed -i "" "s/versionCode .*/versionCode $newVersionCode/" $gradleFile || error "Failed to update Android versionCode"
  echo "Android versionCode updated to $newVersionCode"
}

# Start script execution
cd electron
npm version $1 --no-git-tag-version || error "Failed to update Electron version"
cd ../
echo "Updated Electron version to $1"

update_ios_version $1
update_android_version $1

npm install --legacy-peer-deps || error "Failed to install dependencies"
git add --all