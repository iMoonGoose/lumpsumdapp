import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import hre from "hardhat";

// Recreate __dirname for ESM (Hardhat 3 uses ESM by default)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const contractName = "LumpSumInEth"; 
  const artifact = await hre.artifacts.readArtifact(contractName);

  // Path to your Next.js frontend contracts folder
  const frontendContractsDir = path.join(
    __dirname,
    "../../nextjs/src/contracts"
  );

  if (!fs.existsSync(frontendContractsDir)) {
    fs.mkdirSync(frontendContractsDir, { recursive: true });
  }

  const contractData = {
    abi: artifact.abi,
    // TODO: Replace with the actual address after deployment,
    // or read it from a JSON file written by your deploy script.
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  };

  fs.writeFileSync(
    path.join(frontendContractsDir, `${contractName}.json`),
    JSON.stringify(contractData, null, 2)
  );

  console.log(`✅ Exported ${contractName} ABI and address to frontend.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});