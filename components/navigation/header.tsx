"use client"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User, Wallet, Coins } from "lucide-react"
import Link from "next/link"
import { signOut } from "@/lib/actions"
import type { User as UserType } from "@/lib/supabase/client"
import Image from "next/image"

interface HeaderProps {
  user?: UserType | null
}

export default function Header({ user }: HeaderProps) {
  const tokenCount = user?.tokens || 0
  const displayName = user?.display_name || user?.username || "Guest"
  const username = user?.username || "guest"
  const avatarUrl = user?.avatar_url ?? null // only truthy if user actually has an avatar

  return (
    <header className="sticky top-0 z-50 border-b border-orange-500/20 bg-black/95 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-3 hover-lift">
            <Image src="/chanceus-logo.png" alt="ChanceUS" width={200} height={60} className="h-12 w-auto" priority />
          </Link>

          {user && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                href="/dashboard"
                className="text-white hover:text-orange-500 transition-colors duration-300 font-medium relative group"
              >
                Dashboard
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/games"
                className="text-white hover:text-orange-500 transition-colors duration-300 font-medium relative group"
              >
                Games
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/matches"
                className="text-white hover:text-orange-500 transition-colors duration-300 font-medium relative group"
              >
                Matches
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
              <Link
                href="/wallet"
                className="text-white hover:text-orange-500 transition-colors duration-300 font-medium relative group"
              >
                Wallet
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            {user && (
              <div className="hidden sm:flex items-center space-x-3 bg-gray-900/50 border border-gray-800 rounded-lg px-3 py-2 max-w-fit">
                <div className="p-2 bg-orange-500 rounded-lg flex-shrink-0">
                  <Coins className="h-4 w-4 text-black" />
                </div>
                <div className="flex items-center space-x-1 min-w-0">
                  <span className="text-white font-bold truncate">{tokenCount.toLocaleString()}</span>
                  <span className="text-orange-500 text-sm flex-shrink-0">tokens</span>
                </div>
              </div>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full hover:bg-white/10">
                    <Avatar className="h-10 w-10 ring-2 ring-orange-500/50">
                      {/* Only render the image if we truly have a user avatar */}
                      {avatarUrl ? (
                        <AvatarImage
                          src={avatarUrl}
                          alt={displayName}
                          className="transition-opacity duration-200 data-[loaded=false]:opacity-0 data-[loaded=true]:opacity-100"
                        />
                      ) : null}
                      <AvatarFallback className="bg-orange-500 text-black font-bold">
                        {displayName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-black/95 border-orange-500/20 rounded-xl"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel className="font-normal p-4">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{displayName}</p>
                      <p className="text-xs leading-none text-orange-500">@{username}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-orange-500/20" />
                  <DropdownMenuItem asChild className="text-white hover:bg-white/10 rounded-lg m-1">
                    <Link href="/profile">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-white hover:bg-white/10 rounded-lg m-1">
                    <Link href="/wallet">
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-white hover:bg-white/10 rounded-lg m-1">
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-orange-500/20" />
                  <DropdownMenuItem
                    className="text-red-400 hover:bg-red-500/10 cursor-pointer rounded-lg m-1"
                    onClick={() => signOut()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login">
                  <Button variant="ghost" className="text-white hover:text-orange-500">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/sign-up">
                  <Button className="btn-primary">Get Started</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}