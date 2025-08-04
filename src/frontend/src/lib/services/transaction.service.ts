import { fetchInitialIcpTransactions } from './icp-transaction.service';
import { fetchInitialIcrcTransactions } from './icrc-transactions.service';

export const fetchAllInitialTransactions = async () =>
	Promise.all([fetchInitialIcrcTransactions(), fetchInitialIcpTransactions()]);
