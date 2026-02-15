import { Link } from 'react-router-dom';

interface GameCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  image?: string;
  path: string;
  status: 'live' | 'coming-soon';
  color: string;
}

function LandingPage() {
  const games: GameCard[] = [
    {
      id: '1',
      title: 'POKEMON WORLD',
      description: 'Infinite procedural islands. Catch them all!',
      icon: '🌍',
      image: '/pokemon.png',
      path: '/pokemon-world',
      status: 'live',
      color: 'bg-green-600'
    },
    {
      id: '2',
      title: 'Tap Trading',
      description: 'Agents tap trade and you bet on those agents, agent with highest profit wins.',
      icon: '🔄',
      image: '/trending.png',
      path: '/tap-trading',
      status: 'live',
      color: 'bg-yellow-600'
    },
    {
      id: '3',
      title: 'ARENA',
      description: 'PvP battles. Climb the ranks.',
      icon: '⚔️',
      path: '#',
      status: 'coming-soon',
      color: 'bg-red-600'
    }
  ];

  return (
    <div className="min-h-screen bg-[#202028] pt-32 pb-20 px-4 font-pixel flex flex-col items-center">

      {/* Retro Header */}
      <div className="text-center mb-16 relative">
        <h1 className="text-4xl md:text-6xl text-yellow-400 mb-4 text-shadow-md tracking-widest uppercase">
          MONOMONS
        </h1>
        <div className="w-full h-1 bg-white mt-4 shadow-[0_4px_0_rgba(0,0,0,0.5)]"></div>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {games.map((game) => (
          <div key={game.id} className="relative group">
            <Link to={game.status === 'live' ? game.path : '#'} className={`block ${game.status === 'coming-soon' ? 'cursor-not-allowed grayscale' : 'cursor-pointer'}`}>

              {/* Cartridge Shape */}
              <div className="bg-[#e0e0e0] p-4 rounded-t-lg shadow-[8px_8px_0px_black] border-4 border-black relative transition-transform group-hover:-translate-y-2 group-active:translate-y-0">

                {/* Cartridge Label Area */}
                <div className={`h-48 w-full ${game.color} border-4 border-black mb-4 relative overflow-hidden flex items-center justify-center`}>
                  {/* Scanlines Overlay */}
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-10 bg-[length:100%_4px,6px_100%] pointer-events-none"></div>

                  {game.image ? (
                    <img src={game.image} alt={game.title} className="w-full h-full p-4 object-contain rendering-pixelated drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]" />
                  ) : (
                    <span className="text-8xl drop-shadow-[4px_4px_0_rgba(0,0,0,0.5)]">{game.icon}</span>
                  )}

                  {/* Status Badge */}
                  {game.status === 'coming-soon' && (
                    <div className="absolute top-2 right-2 bg-black text-white text-[8px] px-2 py-1 border border-white">
                      LOCKED
                    </div>
                  )}
                </div>

                {/* Cartridge Details */}
                <div className="bg-[#c0c0c0] p-2 border-2 border-gray-500 inset-shadow">
                  <h3 className="text-xs font-bold text-black uppercase mb-1 truncate">{game.title}</h3>
                  <p className="text-[8px] text-gray-700 font-mono leading-tight h-8 overflow-hidden">
                    {game.description}
                  </p>
                </div>

                {/* Grip Lines */}
                <div className="mt-4 flex justify-center gap-1">
                  <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
                  <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
                </div>

              </div>

              {/* Insert Slot Shadow */}
              <div className="absolute -bottom-4 left-4 right-4 h-4 bg-black/30 rounded-full blur-md -z-10 group-hover:scale-90 transition-transform"></div>
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-20 text-[10px] text-gray-600 font-mono text-center">
        © 2025 MONOMONS CORP. ALL RIGHTS RESERVED.
      </div>
    </div>
  );
}

export default LandingPage;
