import { DigestAlgorithm } from './digest-algorithm.type';
import { HashingAlgorithm } from './hashing-algorithm.type';

export class AuthOptions {
  saltLength: number;
  hashLength: number;
  iterations: number;
  digest: DigestAlgorithm;
  algorithm: HashingAlgorithm;
  pepper: string;
  pepperVersion: string;
}
