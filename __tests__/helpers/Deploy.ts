export async function deployContract(dolomiteMargin: any, json: any, args?: any[]) {
  const contract = new dolomiteMargin.web3.eth.Contract(json.abi);
  const receipt = await contract
    .deploy({
      arguments: args,
      data: json.bytecode,
    })
    .send({
      from: dolomiteMargin.web3.eth.defaultAccount,
      gas: '6500000',
      gasPrice: '1',
    });
  contract.options.address = receipt._address;
  contract.options.from = dolomiteMargin.web3.eth.defaultAccount;
  return contract;
}
