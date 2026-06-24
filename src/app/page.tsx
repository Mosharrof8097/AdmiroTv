'use client'
import { useEffect, useState, useRef } from 'react'
import { Tv, Film, Globe, Gamepad2, MonitorPlay } from 'lucide-react'
import Hls from 'hls.js'

// We will fetch the channel data dynamically now
const BannerAd728x90 = () => {
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bannerRef.current || bannerRef.current.firstChild) return;
    
    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.innerHTML = `atOptions = {
      'key' : 'a0af991fff128a94e1d5c40992c27c0d',
      'format' : 'iframe',
      'height' : 90,
      'width' : 728,
      'params' : {}
    };`;
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highperformanceformat.com/a0af991fff128a94e1d5c40992c27c0d/invoke.js';
    
    bannerRef.current.appendChild(conf);
    bannerRef.current.appendChild(script);
  }, []);

  return <div ref={bannerRef} className="w-[728px] h-[90px] mx-auto flex items-center justify-center overflow-hidden"></div>
}

const BannerAd300x250 = () => {
  const bannerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!bannerRef.current || bannerRef.current.firstChild) return;
    
    const conf = document.createElement('script');
    conf.type = 'text/javascript';
    conf.innerHTML = `atOptions = {
      'key' : 'f768366d0f048200db999a4dc10cc650',
      'format' : 'iframe',
      'height' : 250,
      'width' : 300,
      'params' : {}
    };`;
    
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'https://www.highperformanceformat.com/f768366d0f048200db999a4dc10cc650/invoke.js';
    
    bannerRef.current.appendChild(conf);
    bannerRef.current.appendChild(script);
  }, []);

  return <div ref={bannerRef} className="w-[300px] h-[250px] mx-auto flex items-center justify-center overflow-hidden"></div>
}

export default function Home() {
  const [channelsData, setChannelsData] = useState<any[]>([])
  const [activeCategory, setActiveCategory] = useState<any>(null)
  const [activeChannel, setActiveChannel] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch the auto-updated channels.json on load
  useEffect(() => {
    fetch('/channels.json')
      .then(res => res.json())
      .then(data => {
        // Only keep categories that have at least 1 channel
        const validData = data.filter((cat: any) => cat.channels && cat.channels.length > 0);
        setChannelsData(validData);
        if (validData.length > 0) {
          setActiveCategory(validData[0]);
          setActiveChannel(validData[0].channels[0]);
        }
        setIsLoading(false);
      })
      .catch(err => {
        console.error("Failed to load channels:", err);
        setIsLoading(false);
      });
  }, [])
  const [isPlaying, setIsPlaying] = useState(false)
  const [showingAd, setShowingAd] = useState(true) // Only true on FIRST load
  const [adTimeLeft, setAdTimeLeft] = useState(5)
  const [showOverlayAd, setShowOverlayAd] = useState(false)
  const [isStreamError, setIsStreamError] = useState(false) // Track if the stream is dead
  const [isVideoBuffering, setIsVideoBuffering] = useState(true) // Track video buffering
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<Hls | null>(null)

  // Initial Welcome Ad Timer (Only runs once)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showingAd && adTimeLeft > 0) {
      timer = setTimeout(() => setAdTimeLeft(p => p - 1), 1000)
    } else if (showingAd && adTimeLeft === 0) {
      setShowingAd(false); // Auto-close welcome ad
    }
    return () => clearTimeout(timer)
  }, [showingAd, adTimeLeft])

  // Overlay Ad Logic: Show a small banner 10 seconds after a video starts
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !showingAd && !isStreamError) {
      timer = setTimeout(() => setShowOverlayAd(true), 10000); // 10 seconds delay
    }
    return () => clearTimeout(timer)
  }, [isPlaying, activeChannel, showingAd, isStreamError])

  const handleChannelChange = (channel: any) => {
    if (channel.id === activeChannel.id) return;
    setActiveChannel(channel);
    setShowingAd(false); // NEVER show full screen ad on channel switch
    setShowOverlayAd(false); // Hide overlay temporarily
    setIsPlaying(false);
    setIsStreamError(false); // Reset error state on new channel
    setIsVideoBuffering(true); // Show loading spinner immediately
  }

  const skipAd = () => {
    setShowingAd(false);
  }

  // HLS Video Player Logic
  useEffect(() => {
    if (!videoRef.current || !activeChannel || showingAd) return;
    const video = videoRef.current;

    // Reset error handler
    const handleError = () => {
      setIsStreamError(true);
      setIsPlaying(false);
    };

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
      const hls = new Hls({
        maxBufferLength: 30,
        enableWorker: true,
      });
      hlsRef.current = hls;
      
      hls.loadSource(activeChannel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setIsPlaying(false));
      });
      
      // Catch HLS Errors (Dead stream, 404, CORS block)
      hls.on(Hls.Events.ERROR, function (event, data) {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
            case Hls.ErrorTypes.MEDIA_ERROR:
              handleError();
              hls.destroy();
              break;
            default:
              handleError();
              hls.destroy();
              break;
          }
        }
      });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = activeChannel.url;
      video.addEventListener('loadedmetadata', () => {
        video.play().catch(() => setIsPlaying(false));
      });
      video.addEventListener('error', handleError);
    }

    return () => {
      if (hlsRef.current) hlsRef.current.destroy();
      video.removeEventListener('error', handleError);
    };
  }, [activeChannel, showingAd]);

  if (isLoading || !activeChannel) {
    return (
      <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8">
        <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin mb-6 shadow-[0_0_30px_rgba(6,182,212,0.5)]" />
        <h2 className="text-2xl font-bold tracking-tight text-white">Loading Premium Channels...</h2>
        <p className="text-cyan-500/70 mt-2 font-medium tracking-wide uppercase text-sm">Verifying live streams</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 md:p-8 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10">
        
        {/* Header with Ad Space */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3.5 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-2xl backdrop-blur-xl border border-white/10 shadow-[0_0_30px_rgba(6,182,212,0.15)]">
              <MonitorPlay className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent tracking-tight">
                AdmiroTV
              </h1>
              <p className="text-cyan-500/70 text-sm font-medium tracking-wide uppercase mt-1">Premium Streaming Portal</p>
            </div>
          </div>
          
          {/* Top Banner Ad Placeholder */}
          <div className="hidden md:flex bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl w-[468px] h-[60px] items-center justify-center text-slate-400 text-sm shadow-xl relative group cursor-pointer hover:bg-white/10 transition-all duration-300">
            <span className="font-medium tracking-wider">Top Banner Ad (468x60)</span>
            <span className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-2xl border-b border-l border-white/10">AD</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Player Section */}
          <div className="lg:col-span-2 space-y-6">
            {/* Player Container */}
            <div className="relative w-full aspect-video bg-black rounded-[2rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 flex items-center justify-center group/player">
              
              {/* Stream Error Message */}
              {isStreamError && !showingAd ? (
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                    <span className="text-red-500 text-3xl">⚠️</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">Stream Unavailable</h3>
                  <p className="text-slate-400 text-sm max-w-md leading-relaxed">
                    This channel is currently off-air or geo-blocked. Please select another premium channel from the sidebar.
                  </p>
                </div>
              ) : showingAd ? (
                <div className="absolute inset-0 z-20 bg-[#0a0a0a] flex flex-col items-center justify-center">
                  <span className="text-cyan-400 text-xs mb-6 uppercase tracking-[0.2em] font-bold border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 rounded-full">
                    Sponsor Message
                  </span>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="https://ui-avatars.com/api/?name=Premium+Brand&background=random&color=fff&size=512&font-size=0.1" alt="Ad" className="h-32 md:h-48 rounded-2xl mb-8 shadow-2xl animate-pulse ring-1 ring-white/10" />
                  
                  {adTimeLeft > 0 ? (
                    <button disabled className="bg-white/5 text-slate-300 px-8 py-3 rounded-full font-semibold border border-white/10 shadow-inner backdrop-blur-md">
                      Stream begins in {adTimeLeft}s...
                    </button>
                  ) : (
                    <button onClick={skipAd} className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-10 py-3 rounded-full font-bold shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300 scale-105 hover:scale-110 active:scale-95">
                      Skip & Watch Live
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {isVideoBuffering && !isStreamError && (
                    <div className="absolute inset-0 z-10 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center">
                      <div className="relative w-16 h-16 flex items-center justify-center mb-4">
                         <div className="absolute inset-0 border-4 border-cyan-500/20 rounded-full"></div>
                         <div className="absolute inset-0 border-4 border-t-cyan-400 rounded-full animate-spin"></div>
                      </div>
                      <span className="text-sm font-bold tracking-[0.2em] text-cyan-400 uppercase animate-pulse">Connecting</span>
                    </div>
                  )}
                  <video 
                    ref={videoRef} 
                    controls 
                    className="w-full h-full object-contain bg-black"
                    onWaiting={() => setIsVideoBuffering(true)}
                    onPlaying={() => {
                      setIsVideoBuffering(false);
                      setIsPlaying(true);
                    }}
                    onPause={() => setIsPlaying(false)}
                  />
                </>
              )}
              
              {/* Overlay Ad (Lower Third) */}
              {showOverlayAd && !showingAd && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-[85%] max-w-[500px] bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 flex items-center justify-between animate-in slide-in-from-bottom-10 fade-in duration-500">
                  <div className="flex items-center gap-3 w-full justify-center text-slate-200 text-sm font-medium">
                     <span className="bg-cyan-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-md">AD</span>
                     Place Overlay Banner Here
                  </div>
                  <button 
                    onClick={() => setShowOverlayAd(false)}
                    className="absolute -top-3 -right-3 bg-slate-800 hover:bg-red-500 text-white w-7 h-7 rounded-full flex items-center justify-center text-xs border border-white/20 transition-colors shadow-xl"
                  >
                    ✕
                  </button>
                </div>
              )}
              
              {!showingAd && (
                <>
                  {/* Channel Watermark */}
                  <div className="absolute top-6 right-6 bg-black/40 backdrop-blur-xl p-2.5 rounded-2xl border border-white/10 pointer-events-none transition-opacity duration-500 opacity-0 group-hover/player:opacity-100 shadow-xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={activeChannel.logo} alt="Logo" className="h-8 object-contain opacity-90" />
                  </div>
                  
                  {/* Live Indicator */}
                  <div className="absolute top-6 left-6 flex items-center gap-2.5 bg-red-500/10 text-red-500 px-4 py-2 rounded-full backdrop-blur-xl border border-red-500/20 text-xs font-bold uppercase tracking-widest shadow-lg">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    Live
                  </div>
                </>
              )}
            </div>

            {/* Below Player Banner Ad (Live Adsterra) */}
            <div className="w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] h-[100px] flex items-center justify-center shadow-xl relative overflow-hidden">
              <div className="scale-75 md:scale-100 flex items-center justify-center">
                <BannerAd728x90 />
              </div>
              <span className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-[2rem] border-b border-l border-white/10 z-10 pointer-events-none">AD</span>
            </div>

            {/* Channel Info Card */}
            <div className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 flex justify-between items-center shadow-xl">
              <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">{activeChannel.name}</h2>
                <p className="text-cyan-400 flex items-center gap-2 mt-2 font-medium">
                  <Tv className="w-4 h-4" /> {activeCategory.category}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 flex flex-col h-[calc(100vh-200px)] min-h-[600px] shadow-2xl relative overflow-hidden">
            {/* Sidebar Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none" />

            <h3 className="text-xl font-bold mb-6 flex items-center gap-3 relative z-10">
              <div className="p-2 bg-cyan-500/20 rounded-xl border border-cyan-500/30">
                <Globe className="w-5 h-5 text-cyan-400" />
              </div>
              Discover
            </h3>

            {/* Categories */}
            <div className="flex gap-3 overflow-x-auto pb-4 mb-6 scrollbar-hide relative z-10">
              {channelsData.map((cat) => {
                const isActive = activeCategory.category === cat.category;
                
                let Icon = Globe;
                if (cat.icon === 'Gamepad2') Icon = Gamepad2;
                if (cat.icon === 'Film') Icon = Film;
                if (cat.icon === 'Tv') Icon = Tv;
                if (cat.icon === 'MonitorPlay') Icon = MonitorPlay;

                return (
                  <button
                    key={cat.category}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 whitespace-nowrap
                      ${isActive 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_5px_20px_rgba(6,182,212,0.3)] border-transparent scale-105' 
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/5'
                      }`}
                  >
                    <Icon className="w-4 h-4" />
                    {cat.category}
                  </button>
                )
              })}
            </div>

            {/* Channels List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent pb-4 relative z-10">
              {activeCategory.channels.map((channel: any) => {
                const isPlayingThis = activeChannel.id === channel.id;
                return (
                  <button
                    key={channel.id}
                    onClick={() => handleChannelChange(channel)}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 border text-left group
                      ${isPlayingThis 
                        ? 'bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-cyan-500/30 shadow-[inset_0_0_20px_rgba(6,182,212,0.1)]' 
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10 hover:shadow-lg'
                      }`}
                  >
                    <div className={`w-16 h-12 rounded-xl flex items-center justify-center p-2 overflow-hidden flex-shrink-0 transition-colors
                      ${isPlayingThis ? 'bg-cyan-500/20' : 'bg-black/50'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={channel.logo} alt={channel.name} className="max-w-full max-h-full object-contain drop-shadow-md" />
                    </div>
                    
                    <div className="flex-1 overflow-hidden">
                      <h4 className={`font-bold tracking-wide truncate ${isPlayingThis ? 'text-cyan-400' : 'text-slate-200 group-hover:text-white'}`}>
                        {channel.name}
                      </h4>
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 font-semibold">HD Stream</p>
                    </div>
                    
                    {isPlayingThis && !showingAd && !isStreamError && (
                      <div className="flex gap-1 bg-cyan-500/10 p-2 rounded-lg border border-cyan-500/20">
                        <span className="w-1 bg-cyan-400 h-3 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]" style={{ animationDelay: '0ms' }} />
                        <span className="w-1 bg-cyan-400 h-4 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]" style={{ animationDelay: '150ms' }} />
                        <span className="w-1 bg-cyan-400 h-2 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]" style={{ animationDelay: '300ms' }} />
                      </div>
                    )}
                  </button>
                )
              })}
              
              {/* Sidebar Square Ad (Live Adsterra) */}
              <div className="mt-8 w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-[2rem] h-[250px] flex items-center justify-center shadow-xl relative overflow-hidden">
                <BannerAd300x250 />
                <span className="absolute top-0 right-0 bg-cyan-500/20 text-cyan-400 text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-[2rem] border-b border-l border-white/10 z-10 pointer-events-none">AD</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
