'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Send, Users, Coins } from 'lucide-react';
import { transferTokens } from '@/lib/transferTokens'; // ← client helper that calls supabase.rpc

interface TransferTokensFormProps {
  userBalance: number;
}

export default function TransferTokensForm({ userBalance }: TransferTokensFormProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const prettyError = (raw: string) => {
    if (/recipient_not_found/i.test(raw)) return 'Recipient not found.';
    if (/insufficient_funds/i.test(raw)) return 'You don’t have enough tokens.';
    if (/cannot_transfer_to_self/i.test(raw)) return 'You cannot transfer tokens to yourself.';
    if (/invalid_amount/i.test(raw)) return 'Amount must be a positive number.';
    if (/unauthorized/i.test(raw)) return 'Please sign in.';
    return raw;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg(null);

    const fd = new FormData(e.currentTarget);
    const recipient = String(fd.get('recipient') || '').trim();
    const amountNum = Number(fd.get('amount'));

    if (!recipient) {
      setMsg({ type: 'error', text: 'Enter a recipient username.' });
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setMsg({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }

    setLoading(true);
    try {
      const res = await transferTokens(recipient, amountNum);
      setMsg({
        type: 'success',
        text: `Sent ${amountNum.toLocaleString()} tokens to ${recipient}. Your new balance: ${res.sender_balance.toLocaleString()}.`,
      });
      // Refresh server-rendered balance/history
      window.location.reload();
    } catch (err: any) {
      setMsg({ type: 'error', text: prettyError(err?.message ?? 'Something went wrong') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Users className="mr-2 h-5 w-5 text-cyan-400" />
          Transfer Tokens
        </CardTitle>
        <CardDescription className="text-gray-400">Send tokens to another player</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {msg && (
            <div
              className={`px-4 py-3 rounded-lg text-center border ${
                msg.type === 'error'
                  ? 'bg-red-500/10 border-red-500/50 text-red-400'
                  : 'bg-green-500/10 border-green-500/50 text-green-400'
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="recipient" className="block text-sm font-medium text-gray-300">
              Recipient Username
            </label>
            <Input
              id="recipient"
              name="recipient"
              type="text"
              placeholder="Enter username (without @)"
              autoCapitalize="none"
              autoCorrect="off"
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-300">
              Amount
            </label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="1"
              max={userBalance}
              placeholder="Enter token amount"
              required
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-cyan-500 focus:ring-cyan-500/20 rounded-lg h-12"
            />
            <div className="text-sm text-gray-400">
              Available balance: {userBalance.toLocaleString()} tokens
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-black font-semibold py-6 text-lg rounded-xl glow-cyan disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Transferring...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send Tokens
              </>
            )}
          </Button>

          <div className="text-xs text-gray-500 text-center">
            Transfers are instant and cannot be reversed. Make sure the recipient username is correct.
          </div>
        </form>
      </CardContent>
    </Card>
  );
}