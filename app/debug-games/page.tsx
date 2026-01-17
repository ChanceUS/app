import { createClient } from "@/lib/supabase/server"
import Header from "@/components/navigation/header"

export default async function DebugGamesPage() {
  const supabase = await createClient()
  
  // Get all games
  const { data: games, error } = await supabase.from("games").select("*")
  
  return (
    <div className="min-h-screen bg-black">
      <Header user={null} />
      <div className="p-8">
        <h1 className="text-2xl font-bold text-white mb-4">Debug Games</h1>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 p-4 rounded mb-4">
            <p className="text-red-400">Error: {error.message}</p>
          </div>
        )}
        
        <div className="bg-gray-900/50 border border-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold text-white mb-2">Games in Database:</h2>
          {games && games.length > 0 ? (
            <div className="space-y-2">
              {games.map((game) => (
                <div key={game.id} className="bg-gray-800/30 p-3 rounded border border-gray-700">
                  <p className="text-white font-mono text-sm">
                    <strong>ID:</strong> {game.id}
                  </p>
                  <p className="text-white font-mono text-sm">
                    <strong>Name:</strong> {game.name}
                  </p>
                  <p className="text-white font-mono text-sm">
                    <strong>Description:</strong> {game.description}
                  </p>
                  <p className="text-white font-mono text-sm">
                    <strong>Active:</strong> {game.is_active ? 'Yes' : 'No'}
                  </p>
                  <p className="text-white font-mono text-sm">
                    <strong>Min Bet:</strong> {game.min_bet}
                  </p>
                  <p className="text-white font-mono text-sm">
                    <strong>Max Bet:</strong> {game.max_bet}
                  </p>
                  <a 
                    href={`/games/${game.id}/create`}
                    className="inline-block mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                  >
                    Test Create Match Link
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400">No games found in database</p>
          )}
        </div>
      </div>
    </div>
  )
}
