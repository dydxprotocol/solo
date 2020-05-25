import Web3 from 'web3';
import { Signer } from './Signer';
import { Contracts } from '../lib/Contracts';
import {
  addressesAreEqual,
} from '../lib/BytesHelper';
import {
  SIGNATURE_TYPES,
  createTypedSignature,
  ecRecoverTypedSignature,
} from '../lib/SignatureHelper';
import {
  address,
  SigningMethod,
  SignableOrder,
  SignedOrder,
  SendOptions,
  CallOptions,
} from '../../src/types';

export abstract class OrderSigner extends Signer {
  protected web3: Web3;
  protected contracts: Contracts;

  // ============ Constructor ============

  constructor(
    web3: Web3,
    contracts: Contracts,
  ) {
    super(web3);
    this.contracts = contracts;
  }

  // ============ Getter Contract Methods ============

  /**
   * Returns true if the contract can process orders.
   */
  public async isOperational(
    options?: CallOptions,
  ): Promise<boolean> {
    return this.contracts.call(
      this.getContract().methods.g_isOperational(),
      options,
    );
  }

  // ============ On-Chain Approve / On-Chain Cancel ============

  /**
   * Sends an transaction to pre-approve an order on-chain (so that no signature is required when
   * filling the order).
   */
  public async approveOrder(
    order: SignableOrder,
    options?: SendOptions,
  ): Promise<any> {
    const stringifiedOrder = this.stringifyOrder(order);
    return this.contracts.send(
      this.getContract().methods.approveOrder(stringifiedOrder),
      options,
    );
  }

  /**
   * Sends an transaction to cancel an order on-chain.
   */
  public async cancelOrder(
    order: SignableOrder,
    options?: SendOptions,
  ): Promise<any> {
    const stringifiedOrder = this.stringifyOrder(order);
    return this.contracts.send(
      this.getContract().methods.cancelOrder(stringifiedOrder),
      options,
    );
  }

  // ============ Signing Methods ============

  /**
   * Sends order to current provider for signing. Can sign locally if the signing account is
   * loaded into web3 and SigningMethod.Hash is used.
   */
  public async signOrder(
    order: SignableOrder,
    signingMethod: SigningMethod,
  ): Promise<string> {
    switch (signingMethod) {
      case SigningMethod.Hash:
      case SigningMethod.UnsafeHash:
      case SigningMethod.Compatibility:
        const orderHash = this.getOrderHash(order);
        const rawSignature = await this.web3.eth.sign(orderHash, order.makerAccountOwner);
        const hashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.DECIMAL);
        if (signingMethod === SigningMethod.Hash) {
          return hashSig;
        }
        const unsafeHashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.NO_PREPEND);
        if (signingMethod === SigningMethod.UnsafeHash) {
          return unsafeHashSig;
        }
        if (this.orderByHashHasValidSignature(orderHash, unsafeHashSig, order.makerAccountOwner)) {
          return unsafeHashSig;
        }
        return hashSig;

      case SigningMethod.TypedData:
      case SigningMethod.MetaMask:
      case SigningMethod.MetaMaskLatest:
      case SigningMethod.CoinbaseWallet:
        return this.ethSignTypedOrderInternal(
          order,
          signingMethod,
        );

      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }
  }

  /**
   * Sends order to current provider for signing of a cancel message. Can sign locally if the
   * signing account is loaded into web3 and SigningMethod.Hash is used.
   */
  public async signCancelOrder(
    order: SignableOrder,
    signingMethod: SigningMethod,
  ): Promise<string> {
    return this.signCancelOrderByHash(
      this.getOrderHash(order),
      order.makerAccountOwner,
      signingMethod,
    );
  }

  /**
   * Sends orderHash to current provider for signing of a cancel message. Can sign locally if
   * the signing account is loaded into web3 and SigningMethod.Hash is used.
   */
  public async signCancelOrderByHash(
    orderHash: string,
    signer: string,
    signingMethod: SigningMethod,
  ): Promise<string> {
    switch (signingMethod) {
      case SigningMethod.Hash:
      case SigningMethod.UnsafeHash:
      case SigningMethod.Compatibility:
        const cancelHash = this.orderHashToCancelOrderHash(orderHash);
        const rawSignature = await this.web3.eth.sign(cancelHash, signer);
        const hashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.DECIMAL);
        if (signingMethod === SigningMethod.Hash) {
          return hashSig;
        }
        const unsafeHashSig = createTypedSignature(rawSignature, SIGNATURE_TYPES.NO_PREPEND);
        if (signingMethod === SigningMethod.UnsafeHash) {
          return unsafeHashSig;
        }
        if (this.cancelOrderByHashHasValidSignature(orderHash, unsafeHashSig, signer)) {
          return unsafeHashSig;
        }
        return hashSig;

      case SigningMethod.TypedData:
      case SigningMethod.MetaMask:
      case SigningMethod.MetaMaskLatest:
      case SigningMethod.CoinbaseWallet:
        return this.ethSignTypedCancelOrderInternal(
          orderHash,
          signer,
          signingMethod,
        );

      default:
        throw new Error(`Invalid signing method ${signingMethod}`);
    }
  }

  // ============ Signature Verification ============

  /**
   * Returns true if the order object has a non-null valid signature from the maker of the order.
   */
  public orderHasValidSignature(
    order: SignedOrder,
  ): boolean {
    return this.orderByHashHasValidSignature(
      this.getOrderHash(order),
      order.typedSignature,
      order.makerAccountOwner,
    );
  }

  /**
   * Returns true if the order hash has a non-null valid signature from a particular signer.
   */
  public orderByHashHasValidSignature(
    orderHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): boolean {
    const signer = ecRecoverTypedSignature(orderHash, typedSignature);
    return addressesAreEqual(signer, expectedSigner);
  }

  /**
   * Returns true if the cancel order message has a valid signature.
   */
  public cancelOrderHasValidSignature(
    order: SignableOrder,
    typedSignature: string,
  ): boolean {
    return this.cancelOrderByHashHasValidSignature(
      this.getOrderHash(order),
      typedSignature,
      order.makerAccountOwner,
    );
  }

  /**
   * Returns true if the cancel order message has a valid signature.
   */
  public cancelOrderByHashHasValidSignature(
    orderHash: string,
    typedSignature: string,
    expectedSigner: address,
  ): boolean {
    const cancelHash = this.orderHashToCancelOrderHash(orderHash);
    const signer = ecRecoverTypedSignature(cancelHash, typedSignature);
    return addressesAreEqual(signer, expectedSigner);
  }

  // ============ Abstract Functions ============

  public abstract getOrderHash(
    order: SignableOrder,
  ): string;

  protected abstract stringifyOrder(
    order: SignableOrder,
  ): string;

  protected abstract orderHashToCancelOrderHash(
    orderHash: string,
  ): string;

  protected abstract getContract(): any;

  protected abstract async ethSignTypedOrderInternal(
    order: SignableOrder,
    signingMethod: SigningMethod,
  ): Promise<string>;

  protected abstract async ethSignTypedCancelOrderInternal(
    orderHash: string,
    signer: address,
    signingMethod: SigningMethod,
  ): Promise<string>;
}
