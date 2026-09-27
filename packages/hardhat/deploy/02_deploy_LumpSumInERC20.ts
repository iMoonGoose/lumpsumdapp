import { network, artifacts } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "node:url";
import { Address } from "viem";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main(): Promise<void> {
  // 1. In Hardhat 3, use network.create() instead of network.connect()
  const { viem, networkName } = await network.create();
  
  const [deployer] = await viem.getWalletClients();
  console.log(`Deploying contracts to ${networkName} with account: ${deployer.account.address}`);

  // 2. Deploy your contract (Replace "YourContract" with your actual contract name)
  const contractName = "LumpSumInERC20";
  const MainnetUSTDT = "0xdac17f958d2ee523a2206206994597c13d831ec7" as Address;

  const contract = await viem.deployContract(contractName, [MainnetUSTDT]);
  
  console.log(`${contractName} successfully deployed to: ${contract.address}`);

  // 3. Export configuration to frontend
  await saveFrontendFiles(contract.address, contractName);
}

async function saveFrontendFiles(address: string, contractName: string): Promise<void> {
  // Adjust this path relative to your script's location to hit your frontend directory
  const frontendDir = path.join(__dirname, "..", "..", "nextjs", "contractsData");

  if (!fs.existsSync(frontendDir)) {
    fs.mkdirSync(frontendDir, { recursive: true });
  }

  // Read the compilation artifact
  const artifact = await artifacts.readArtifact(contractName);

  // Generate a strictly-typed TS file providing `as const` for frontend autocompletes
  const fileContent = `export const ${contractName.toLowerCase()}Address = "${address}" as const;
export const ${contractName.toLowerCase()}Abi = ${JSON.stringify(artifact.abi, null, 2)} as const;
`;

  fs.writeFileSync(
    path.join(frontendDir, `${contractName.toLowerCase()}.ts`),
    fileContent
  );

  console.log(`Frontend configurations written to: ${frontendDir}/${contractName.toLowerCase()}.ts`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});