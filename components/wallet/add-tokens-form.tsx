"use client"

import { useActionState } from "react"
import { useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CreditCard, Wallet } from "lucide-react"
import { addTokens } from "@/lib/wallet-actions"

const tokenPackages = [
  { amount: 100, price: 9.99, bonus: 0 },
  { amount: 500, price: 49.99, bonus: 50 },
  { amount: 1000, price: 99.99, bonus: 150 },
  { amount: 2500, price: 249.99, bonus: 500 },
  { amount: 5000, price: 499.99, bonus: 1000 },
]

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold py-6 text-lg rounded-xl glow-yellow"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Processing Purchase...
        </>
      ) : (
        <>
          <CreditCard className="mr-2 h-5 w-5" />
          Purchase Tokens
        </>
      )}
    </Button>
  )
}

export default function AddTokensForm() {
  const [state, formAction] = useActionState(addTokens, null)

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Wallet className="mr-2 h-5 w-5 text-yellow-400" />
          Add Tokens
        </CardTitle>
        <CardDescription className="text-gray-400">Purchase tokens to play games and compete</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-center">
              {state.error}
            </div>
          )}

          {state?.success && (
            <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-center">
              {state.success}
            </div>
          )}

          {/* Token Packages */}
          <div className="space-y-4">
            <label className="block text-sm font-medium text-gray-300">Select Package</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tokenPackages.map((pkg) => (
                <label
                  key={pkg.amount}
                  className="relative flex items-center p-4 bg-gray-800/30 border border-gray-700 rounded-lg cursor-pointer hover:bg-gray-800/50 transition-colors"
                >
                  <input type="radio" name="amount" value={pkg.amount + pkg.bonus} className="sr-only" required />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{pkg.amount.toLocaleString()} tokens</span>
                      <span className="text-yellow-400 font-bold">${pkg.price}</span>
                    </div>
                    {pkg.bonus > 0 && <div className="text-sm text-green-400">+{pkg.bonus} bonus tokens!</div>}
                    <div className="text-xs text-gray-400">
                      Total: {(pkg.amount + pkg.bonus).toLocaleString()} tokens
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <label htmlFor="customAmount" className="block text-sm font-medium text-gray-300">
              Or enter custom amount (10-10,000 tokens)
            </label>
            <Input
              id="customAmount"
              name="amount"
              type="number"
              min="10"
              max="10000"
              placeholder="Enter token amount"
              className="bg-gray-800/50 border-gray-700 text-white placeholder:text-gray-500 focus:border-yellow-500 focus:ring-yellow-500/20 rounded-lg h-12"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Payment Method</label>
            <Select name="paymentMethod" required>
              <SelectTrigger className="bg-gray-800/50 border-gray-700 text-white focus:border-yellow-500">
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-gray-800">
                <SelectItem value="credit-card" className="text-white hover:bg-gray-800">
                  Credit Card
                </SelectItem>
                <SelectItem value="debit-card" className="text-white hover:bg-gray-800">
                  Debit Card
                </SelectItem>
                <SelectItem value="paypal" className="text-white hover:bg-gray-800">
                  PayPal
                </SelectItem>
                <SelectItem value="crypto" className="text-white hover:bg-gray-800">
                  Cryptocurrency
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SubmitButton />

          <div className="text-xs text-gray-500 text-center">
            Secure payment processing. Your payment information is encrypted and protected.
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
