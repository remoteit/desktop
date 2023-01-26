require("dotenv").config();

const os = require("os");
const path = require("path");
const { exec } = require("child_process");

const TEMP_DIR = path.resolve(__dirname, "../temp");
const TOOL_PATH = path.resolve(os.homedir(), "CodeSignTool/CodeSignTool.bat");
const TOOL_DIR = path.resolve(os.homedir(), "CodeSignTool/");
const CMD_PATH = path.resolve("C:/Windows/System32/cmd.exe");
const FILE_PATH = path.resolve(
    "C:/Users/jamie/Code/desktop/dist/win-ia32-unpacked/resources/x86/remoteit.exe"
);

const username = process.env.WINDOWS_SIGN_USER_NAME
const userPassword = process.env.WINDOWS_SIGN_USER_PASSWORD
const credentialId = process.env.WINDOWS_SIGN_CREDENTIAL_ID
const userTOTP = process.env.WINDOWS_SIGN_USER_TOTP

console.log(`\nSigning Window Binary ${FILE_PATH}`);
const { name, dir } = path.parse(FILE_PATH);

// Sign and replace file
const tempFile = path.join(TEMP_DIR, name);
// const signFile = `${CMD_PATH} /C ${TOOL_PATH} 'testing'`;
const signFile = `${CMD_PATH} /C ${TOOL_PATH} sign -input_file_path="${FILE_PATH}" -output_dir_path="${TEMP_DIR}" -credential_id="${credentialId}" -username="${username}" -password="${userPassword}" -totp_secret="${userTOTP}"`;
const moveFile = `"${tempFile}" "${dir}"`;

console.log("\nCommand path: \n", CMD_PATH);
console.log("\nCommand Start: \n", signFile);

var ls = exec(signFile, { shell: true, env: { CODE_SIGN_TOOL_PATH: TOOL_DIR } });
ls.stdout.on("data", data => console.log('stdout', data));
ls.stderr.on("data", data => console.error('stderr', data));
ls.on("exit", (code) => console.log('EXIT', code));
