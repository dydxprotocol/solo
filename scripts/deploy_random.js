// Right click on the script name and hit "Run" to execute
(async () => {
  try {
    console.log('Running deployWithWeb3 script...');

    const contractName = 'CustomTestToken';
    const constructorArgs = ['USD Coin', 'USDC', 6];

    // Note that the script needs the ABI which is generated from the compilation artifact.
    // Make sure contract is compiled and artifacts are generated
    const artifactsPath = `browser/contracts/artifacts/${contractName}.json`; // Change this for different path

    const metadata = JSON.parse(await remix.call('fileManager', 'getFile', artifactsPath));
    const accounts = await web3.eth.getAccounts();

    let contract = new web3.eth.Contract(metadata.abi);

    contract = contract.deploy({
      data: metadata.data.bytecode.object,
      arguments: constructorArgs,
    });

    const newContractInstance = await contract.send({
      from: accounts[0],
      gas: 1500000,
      gasPrice: '30000000000',
    });
    console.log('Contract deployed at address: ', newContractInstance.options.address);
  } catch (e) {
    console.log(e.message);
  }
})();
