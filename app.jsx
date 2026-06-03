import React, { useState, useEffect, useRef, useCallback } from 'react';

const img = (filename) => `${import.meta.env.BASE_URL}images/${filename}`;

// --- Data ---

const CHARACTERS = [
  { id: 'amelka', name: 'Amelka', image: img('person-amelka.png') },
  { id: 'clem', name: 'Clem', image: img('person-clem.png') },
  { id: 'dexter', name: 'Dexter', image: img('person-dexter.png') },
  { id: 'riley', name: 'Riley', image: img('person-riley.png') },
];

const LUGGAGE = [
  { id: 'kids', name: 'Kids Wheelie', imageOpen: img('luggage-kids-open.png'), imageClosed: img('luggaue-kids-closed.png') },
  { id: 'backpack', name: 'Sporty Backpack', imageOpen: img('lugguage-backpack-open.png'), imageClosed: img('lugguage-backpack-closed.png') },
  { id: 'suitcase', name: 'Suitcase', imageOpen: img('lugguage-suitcase-open.png'), imageClosed: img('lugguage-suitcase-closed.png') },
];

// allowed: can go through scanner | mandatory: must be in bag (passport)
const ITEMS = [
  { id: 'banana',      name: 'Banana',      image: img('item-banana.png'),      allowed: true,  mandatory: false },
  { id: 'books',       name: 'Books',       image: img('item-books.png'),       allowed: true,  mandatory: false },
  { id: 'cap',         name: 'Cap',         image: img('item-cap.png'),         allowed: true,  mandatory: false },
  { id: 'clock',       name: 'Clock',       image: img('item-clock.png'),       allowed: false, mandatory: false },
  { id: 'frog',        name: 'Frog',        image: img('item-frog.png'),        allowed: false, mandatory: false },
  { id: 'guitar',      name: 'Guitar',      image: img('item-guitar.png'),      allowed: true,  mandatory: false },
  { id: 'llama',       name: 'Llama',       image: img('item-llama.png'),       allowed: false, mandatory: false },
  { id: 'panties',     name: 'Pants',       image: img('item-panties.png'),     allowed: true,  mandatory: false },
  { id: 'passport',    name: 'Passport',    image: img('item-passport.png'),    allowed: true,  mandatory: true  },
  { id: 'pencilcase',  name: 'Pencil Case', image: img('item-pencilcase.png'),  allowed: true,  mandatory: false },
  { id: 'phone',       name: 'Phone',       image: img('item-phone.png'),       allowed: true,  mandatory: false },
  { id: 'pizza',       name: 'Pizza',       image: img('item-pizza.png'),       allowed: true,  mandatory: false },
  { id: 'pogo',        name: 'Pogo Stick',  image: img('item-pogo.png'),        allowed: true,  mandatory: false },
  { id: 'shampoo',     name: 'Shampoo',     image: img('item-shampoo.png'),     allowed: true,  mandatory: false },
  { id: 'shoes',       name: 'Shoes',       image: img('item-shoes.png'),       allowed: true,  mandatory: false },
  { id: 'showercap',   name: 'Shower Cap',  image: img('item-showercap.png'),   allowed: true,  mandatory: false },
  { id: 'scissors',    name: 'Scissors',    image: img('item-sisscors.png'),    allowed: false, mandatory: false },
  { id: 'socks',       name: 'Socks',       image: img('item-socks.png'),       allowed: true,  mandatory: false },
  { id: 'sunglasses',  name: 'Sunglasses',  image: img('item-sunglasses.png'),  allowed: true,  mandatory: false },
  { id: 'tire',        name: 'Tyre',        image: img('item-tire.png'),        allowed: false, mandatory: false },
  { id: 'toothpaste',  name: 'Toothpaste',  image: img('item-toothpaste.png'),  allowed: true,  mandatory: false },
  { id: 'trophy',      name: 'Trophy',      image: img('item-trophy.png'),      allowed: true,  mandatory: false },
  { id: 'undies',      name: 'Undies',      image: img('item-undies.png'),      allowed: true,  mandatory: false },
  { id: 'walkman',     name: 'Walkman',     image: img('item-walkman.png'),     allowed: true,  mandatory: false },
  { id: 'waterbottle', name: 'Water Bottle',image: img('item-water-bottle.png'),allowed: false, mandatory: false },
  { id: 'yoyo',        name: 'Yo-yo',       image: img('item-yoyo.png'),        allowed: true,  mandatory: false },
];

// 12 fixed positions — floor, bookshelf, windowsill only (bed reserved for the bag)
const POSITIONS = [
  { x:  3, y: 73 },  // floor — far left
  { x: 13, y: 74 },  // floor — left
  { x: 23, y: 73 },  // floor — centre-left
  { x: 33, y: 74 },  // floor — centre
  { x: 52, y: 74 },  // floor — centre-right
  { x: 63, y: 73 },  // floor — right
  { x: 72, y: 74 },  // floor — right edge
  { x:  5, y: 48 },  // bookshelf — top shelf left
  { x: 15, y: 48 },  // bookshelf — top shelf right
  { x:  5, y: 60 },  // bookshelf — bottom shelf
  { x: 83, y: 50 },  // windowsill — upper
  { x: 84, y: 62 },  // windowsill — lower
];

const VISIBLE_COUNT = 6; // how many items are shown at once

// --- Audio ---

function playPlopSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(520, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.13);
    gain.gain.setValueAtTime(0.45, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.28);
  } catch {
    // Audio not available
  }
}

// --- Drag hook ---

function useDrag(initialPos, containerRef, onRelease, onTap, onMove, onDragStart, onDragEnd) {
  const [pos, setPos] = useState(initialPos);
  const [isDragging, setIsDragging] = useState(false);
  const state = useRef({ pos: initialPos, startMouse: null, startPos: null });
  const onReleaseRef   = useRef(onRelease);
  const onTapRef       = useRef(onTap);
  const onMoveRef      = useRef(onMove);
  const onDragStartRef = useRef(onDragStart);
  const onDragEndRef   = useRef(onDragEnd);
  onReleaseRef.current   = onRelease;
  onTapRef.current       = onTap;
  onMoveRef.current      = onMove;
  onDragStartRef.current = onDragStart;
  onDragEndRef.current   = onDragEnd;
  state.current.pos = pos;

  const onMouseDown = useCallback((e) => {
    e.preventDefault();
    state.current.startMouse = { x: e.clientX, y: e.clientY };
    state.current.startPos = { ...state.current.pos };
    setIsDragging(true);
    onDragStartRef.current?.();
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMouseMove = (e) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const dx = ((e.clientX - state.current.startMouse.x) / rect.width) * 100;
      const dy = ((e.clientY - state.current.startMouse.y) / rect.height) * 100;
      const newPos = { x: state.current.startPos.x + dx, y: state.current.startPos.y + dy };
      setPos(newPos);
      onMoveRef.current?.(newPos);
    };
    const onUp = (e) => {
      setIsDragging(false);
      onDragEndRef.current?.();
      const dx = e.clientX - state.current.startMouse.x;
      const dy = e.clientY - state.current.startMouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 6) {
        onTapRef.current?.();
      } else {
        // Compute final item top-left position (% of container) so drop handlers
        // can use the item's visual position rather than the cursor position.
        const rect = containerRef.current?.getBoundingClientRect();
        const finalPos = rect ? {
          x: state.current.startPos.x + (dx / rect.width)  * 100,
          y: state.current.startPos.y + (dy / rect.height) * 100,
        } : state.current.pos;
        onReleaseRef.current?.(e.clientX, e.clientY, finalPos);
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, containerRef]);

  return { pos, setPos, isDragging, onMouseDown };
}

// --- Deterministic sticker rotation ---

const stickerRotation = (id) => {
  const n = id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return ((n % 11) - 5);
};

// --- Draggable sticker ---

const DraggableSticker = React.forwardRef(function DraggableSticker(
  { image, name, initialPos, containerRef, widthPct = 9, heightPct, baseZ = 30,
    onRelease, onTap, onMove, onDragStart, onDragEnd, popIn = false, controlledPos, onDetach },
  ref
) {
  const { pos, setPos, isDragging, onMouseDown } = useDrag(initialPos, containerRef, onRelease, onTap, onMove, onDragStart, onDragEnd);
  const rot = stickerRotation(name);
  const scale = isDragging ? 1.08 : 1;

  // When attached to a character (controlledPos set), render at that position.
  // When the user starts dragging, sync internal pos first then detach.
  const renderPos = (!isDragging && controlledPos) ? controlledPos : pos;

  const handleMouseDown = (e) => {
    if (controlledPos) {
      setPos(controlledPos); // snap internal pos to current visual pos before drag starts
      onDetach?.();
    }
    onMouseDown(e);
  };

  return (
    <div
      ref={ref}
      onMouseDown={handleMouseDown}
      className={`absolute select-none cursor-grab active:cursor-grabbing${popIn ? ' sticker-pop' : ''}`}
      style={{
        left: `${renderPos.x}%`,
        top: `${renderPos.y}%`,
        width: `${widthPct}%`,
        ...(heightPct ? { height: `${heightPct}%` } : {}),
        zIndex: isDragging ? 1000 : baseZ,
        transform: `rotate(${isDragging ? 0 : rot}deg) scale(${scale})`,
        transformOrigin: 'center bottom',
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), width 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.28))',
      }}
    >
      <img
        src={image}
        alt={name}
        className="pointer-events-none"
        style={heightPct ? { width: '100%', height: '100%', objectFit: 'contain' } : { width: '100%', height: 'auto' }}
        draggable={false}
      />
    </div>
  );
});

// --- Shared layout ---

const GameContainer = React.forwardRef(function GameContainer({ children, bg }, ref) {
  return (
    <div
      className="w-screen h-screen flex items-center justify-center"
      style={{ background: bg || '#5BB8E8' }}
    >
      <div
        ref={ref}
        className="relative overflow-hidden"
        style={{
          aspectRatio: '16 / 9',
          width: 'min(100vw, calc(100vh * 16 / 9))',
          height: 'min(100vh, calc(100vw * 9 / 16))',
        }}
      >
        {children}
      </div>
    </div>
  );
});

// --- Screens ---

function StartScreen({ onPlay }) {
  return (
    <GameContainer bg="#5BB8E8">
      {/* Full-screen start scene */}
      <img
        src={img('scene-start.jpg')}
        alt="Start"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        style={{ zIndex: 0 }}
      />
      {/* "Tap anywhere to continue" hint */}
      <p
        className="absolute font-black"
        style={{
          bottom: '7%',
          width: '100%',
          textAlign: 'center',
          fontSize: '1.8vw',
          color: 'white',
          textShadow: '0 2px 8px rgba(0,0,0,0.35)',
          letterSpacing: '0.05em',
          zIndex: 5,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      >
        Tap anywhere to continue
      </p>
      {/* Invisible full-screen tap area to start */}
      <button
        onClick={onPlay}
        className="absolute inset-0 w-full h-full"
        style={{ zIndex: 10, background: 'transparent', cursor: 'pointer' }}
        aria-label="Play Now"
      />
    </GameContainer>
  );
}

// Public mode: the two selectable base characters
const PUBLIC_CHARACTERS = [
  CHARACTERS.find(c => c.id === 'amelka'), // girl shape
  CHARACTERS.find(c => c.id === 'dexter'), // boy shape
];
// Public mode: opposite friend on the beach
const PUBLIC_BEACH_FRIEND = {
  amelka: CHARACTERS.find(c => c.id === 'dexter'),
  dexter: CHARACTERS.find(c => c.id === 'amelka'),
};

function CharacterScreen({ onSelect }) {
  // Public mode: two-step — pick shape, then enter name
  const [picked, setPicked] = useState(null); // base character object
  const [name,   setName]   = useState('');

  if (GAME_MODE === 'public') {
    // Step 2: name entry
    if (picked) {
      const trimmed = name.trim();
      return (
        <GameContainer bg="#FFE8CC">
          <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFE8CC 0%, #FFFDF5 100%)' }} />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6" style={{ zIndex: 10 }}>
            <img src={picked.image} alt="" style={{ height: '18vw', maxHeight: '220px', width: 'auto', objectFit: 'contain', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))' }} draggable={false} />
            <h2 className="font-black" style={{ fontSize: '3.2vw', color: '#1A7AC7', textShadow: '3px 3px 0 white' }}>
              What's your name?
            </h2>
            <input
              autoFocus
              type="text"
              maxLength={16}
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && trimmed && onSelect({ ...picked, name: trimmed })}
              placeholder="Type your name…"
              className="font-black text-center"
              style={{
                fontSize: '2.8vw', padding: '0.7vw 2vw', borderRadius: '999px',
                border: '4px solid #87D4F5', outline: 'none', background: 'white',
                color: '#1A7AC7', boxShadow: '0 4px 0 #4AAFE0', width: '36%',
              }}
            />
            <div style={{ display: 'flex', gap: '1.5vw' }}>
              <button
                onClick={() => setPicked(null)}
                className="font-bold rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ padding: '0.7vw 2vw', background: 'white', color: '#888', fontSize: '1.4vw', border: '3px solid #ddd', boxShadow: '0 3px 0 #bbb' }}
              >
                ← Back
              </button>
              <button
                disabled={!trimmed}
                onClick={() => onSelect({ ...picked, name: trimmed })}
                className="font-black rounded-full transition-all hover:scale-105 active:scale-95"
                style={{ padding: '0.7vw 2.5vw', background: trimmed ? '#FFD166' : '#ddd', color: trimmed ? '#7A4F00' : '#aaa', fontSize: '1.6vw', border: '4px solid white', boxShadow: `0 5px 0 ${trimmed ? '#C9A000' : '#bbb'}`, cursor: trimmed ? 'pointer' : 'not-allowed' }}
              >
                Let's go! →
              </button>
            </div>
          </div>
        </GameContainer>
      );
    }

    // Step 1: pick girl or boy
    return (
      <GameContainer bg="#FFE8CC">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFE8CC 0%, #FFFDF5 100%)' }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-8" style={{ zIndex: 10 }}>
          <h2 className="font-black" style={{ fontSize: '3.6vw', color: '#1A7AC7', textShadow: '3px 3px 0 white' }}>
            Who's going on holiday?
          </h2>
          <div className="flex gap-12">
            {PUBLIC_CHARACTERS.map(char => (
              <button
                key={char.id}
                onClick={() => setPicked(char)}
                className="flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 rounded-3xl"
                style={{ padding: '1.5vw', background: 'white', border: '5px solid #87D4F5', boxShadow: '0 6px 0 #4AAFE0' }}
              >
                <img src={char.image} alt={char.id === 'amelka' ? 'Girl' : 'Boy'} style={{ height: '22vw', maxHeight: '260px', width: 'auto', objectFit: 'contain' }} draggable={false} />
                <span className="font-black" style={{ fontSize: '1.8vw', color: '#1A7AC7' }}>
                  {char.id === 'amelka' ? "I'm a girl 👧" : "I'm a boy 👦"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </GameContainer>
    );
  }

  // Private mode: all 4 named characters
  return (
    <GameContainer bg="#FFE8CC">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #FFE8CC 0%, #FFFDF5 100%)' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8" style={{ zIndex: 10 }}>
        <h2 className="font-black" style={{ fontSize: '3.6vw', color: '#1A7AC7', textShadow: '3px 3px 0 white' }}>
          Who's going on holiday?
        </h2>
        <div className="flex gap-8">
          {CHARACTERS.map(char => (
            <button
              key={char.id}
              onClick={() => onSelect(char)}
              className="flex flex-col items-center gap-3 transition-all hover:scale-105 active:scale-95 rounded-3xl"
              style={{ padding: '1.5vw', background: 'white', border: '5px solid #87D4F5', boxShadow: '0 6px 0 #4AAFE0' }}
            >
              <img src={char.image} alt={char.name} style={{ height: '22vw', maxHeight: '260px', width: 'auto', objectFit: 'contain' }} draggable={false} />
              <span className="font-black" style={{ fontSize: '1.8vw', color: '#1A7AC7' }}>{char.name}</span>
            </button>
          ))}
        </div>
      </div>
    </GameContainer>
  );
}

function LuggageScreen({ character, onSelect, onBack }) {
  return (
    <GameContainer bg="#C8EDFF">
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, #C8EDFF 0%, #FFFDF5 100%)' }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-8" style={{ zIndex: 10 }}>
        <h2 className="font-black" style={{ fontSize: '3.6vw', color: '#FF6B35', textShadow: '3px 3px 0 white' }}>
          {character.name}, pick your bag!
        </h2>
        <div className="flex gap-12" style={{ paddingLeft: '8vw', paddingRight: '8vw' }}>
          {LUGGAGE.map(bag => (
            <button
              key={bag.id}
              onClick={() => onSelect(bag)}
              className="flex flex-col items-center transition-all hover:scale-105 active:scale-95 rounded-3xl"
              style={{ padding: '1.8vw 2.5vw', background: 'white', border: '5px solid #FFD166', boxShadow: '0 6px 0 #C9A000' }}
            >
              <img src={bag.imageClosed} alt={bag.name} style={{ height: '20vw', maxHeight: '220px', width: 'auto', objectFit: 'contain' }} draggable={false} />
            </button>
          ))}
        </div>
        <button onClick={onBack} className="font-bold underline transition-opacity hover:opacity-60" style={{ fontSize: '1.2vw', color: '#5B8BA0' }}>
          ← Back
        </button>
      </div>
    </GameContainer>
  );
}

function RoomScene({ character, luggage, onGoToAirport }) {
  const containerRef = useRef(null);
  const bagRef  = useRef(null);
  const charRef = useRef(null);
  const [bagOpen, setBagOpen] = useState(false);
  const [charPos, setCharPos] = useState({ x: 53, y: 38 });
  // attachments: { [slotIdx]: { relX, relY } } — item position relative to charPos
  const [attachments, setAttachments] = useState({});

  // 12 positions, 6 occupied at start. New items fill a random empty slot when one is packed.
  const [game, setGame] = useState(() => {
    const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);
    const posOrder = [...POSITIONS.keys()].sort(() => Math.random() - 0.5);
    const slots = POSITIONS.map(pos => ({ pos, item: null }));
    posOrder.slice(0, VISIBLE_COUNT).forEach((posIdx, i) => {
      slots[posIdx] = { pos: POSITIONS[posIdx], item: shuffled[i] };
    });
    return { shuffled, slots, nextIndex: VISIBLE_COUNT, packedCount: 0, packedItems: [] };
  });

  const bagWidthPct = 20 * (1 + game.packedCount * 0.04);

  const handleItemDetach = useCallback((slotIdx) => {
    setAttachments(prev => { const n = { ...prev }; delete n[slotIdx]; return n; });
  }, []);

  const handleItemRelease = useCallback((slotIdx, mouseX, mouseY) => {
    // --- Dress-up: drop on character ---
    if (charRef.current) {
      const charRect = charRef.current.getBoundingClientRect();
      const onChar = mouseX >= charRect.left && mouseX <= charRect.right &&
                     mouseY >= charRect.top  && mouseY <= charRect.bottom;
      if (onChar) {
        const cRect = containerRef.current.getBoundingClientRect();
        const dropX = (mouseX - cRect.left) / cRect.width  * 100;
        const dropY = (mouseY - cRect.top)  / cRect.height * 100;
        setAttachments(prev => ({ ...prev, [slotIdx]: { relX: dropX - charPos.x, relY: dropY - charPos.y } }));
        return;
      }
    }

    // --- Pack into bag ---
    if (!bagRef.current || !bagOpen) return;
    const rect = bagRef.current.getBoundingClientRect();
    const over =
      mouseX >= rect.left && mouseX <= rect.right &&
      mouseY >= rect.top && mouseY <= rect.bottom;
    if (!over) return;

    playPlopSound();
    setGame(prev => {
      const newSlots = prev.slots.map(s => ({ ...s }));
      newSlots[slotIdx] = { ...newSlots[slotIdx], item: null };

      const nextItem = prev.shuffled[prev.nextIndex] ?? null;
      if (nextItem) {
        const emptyIdxs = newSlots.map((s, i) => s.item === null ? i : -1).filter(i => i >= 0);
        const target = emptyIdxs[Math.floor(Math.random() * emptyIdxs.length)];
        newSlots[target] = { ...newSlots[target], item: nextItem };
      }

      return {
        ...prev,
        slots: newSlots,
        nextIndex: nextItem ? prev.nextIndex + 1 : prev.nextIndex,
        packedCount: prev.packedCount + 1,
      };
    });
  }, [bagOpen, charPos]);

  return (
    <GameContainer ref={containerRef} bg="#5BB8E8">
      {/* Room background */}
      <img
        src={img('scene-room.png')}
        alt="Room"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
        style={{ zIndex: 0, filter: 'brightness(0.97) saturate(0.75)' }}
      />

      {/* Item stickers — one per slot, pop in when a new item replaces a packed one */}
      {game.slots.map((slot, slotIdx) => {
        if (!slot.item) return null;
        const att = attachments[slotIdx];
        const controlledPos = att ? { x: charPos.x + att.relX, y: charPos.y + att.relY } : undefined;
        return (
          <DraggableSticker
            key={slot.item.id}
            image={slot.item.image}
            name={slot.item.name}
            initialPos={slot.pos}
            containerRef={containerRef}
            widthPct={14}
            heightPct={14}
            baseZ={controlledPos ? 45 : 30}
            popIn
            controlledPos={controlledPos}
            onDetach={() => handleItemDetach(slotIdx)}
            onRelease={(mx, my) => handleItemRelease(slotIdx, mx, my)}
          />
        );
      })}

      {/* Bag — starts closed, tap to open/close */}
      <DraggableSticker
        ref={bagRef}
        image={bagOpen ? luggage.imageOpen : luggage.imageClosed}
        name={luggage.name}
        initialPos={{ x: 48, y: 46 }}
        containerRef={containerRef}
        widthPct={bagWidthPct}
        heightPct={38}
        baseZ={40}
        onTap={() => setBagOpen(o => !o)}
      />

      {/* Character — on the bed */}
      <DraggableSticker
        ref={charRef}
        image={character.image}
        name={character.name}
        initialPos={{ x: 53, y: 38 }}
        containerRef={containerRef}
        widthPct={13}
        baseZ={40}
        onMove={setCharPos}
      />

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 flex items-center px-4 py-2" style={{ zIndex: 50, pointerEvents: 'none' }}>
        <div
          className="font-black"
          style={{ fontSize: '1.4vw', background: 'white', border: '3px solid #FFD166', borderRadius: '999px', padding: '0.4vw 1.2vw', color: '#7A4F00', pointerEvents: 'auto' }}
        >
          {character.name}'s Room
        </div>
        {game.packedCount > 0 && (
          <div
            className="ml-3 font-black"
            style={{ fontSize: '1.2vw', background: '#6BCB77', border: '3px solid white', borderRadius: '999px', padding: '0.4vw 1.2vw', color: 'white' }}
          >
            {game.packedCount} packed ✓
          </div>
        )}
      </div>

      {/* Go to Airport button — only when bag is closed and has at least 1 item packed */}
      {!bagOpen && game.packedCount > 0 && (
        <button
          onClick={() => {
            const allIntroduced = game.shuffled.slice(0, game.nextIndex);
            const inSlots = new Set(game.slots.filter(s => s.item).map(s => s.item.id));
            const packedItemsList = allIntroduced.filter(item => !inSlots.has(item.id));
            onGoToAirport(packedItemsList);
          }}
          className="absolute font-black rounded-full transition-all hover:scale-105 active:scale-95"
          style={{ bottom: '3%', right: '2%', zIndex: 50, padding: '0.7vw 1.8vw', background: '#FFD166', color: '#7A4F00', fontSize: '1.5vw', border: '4px solid white', boxShadow: '0 5px 0 #C9A000' }}
        >
          ✈️ To Airport!
        </button>
      )}
    </GameContainer>
  );
}

// --- Guard quips ---

const GUARD_QUIPS = {
  clock:       "A clock?! Is this a spy movie?! I'm calling backup! ⏰",
  frog:        "Ooh, a frog! I might kiss it to see if it's a prince! 🐸",
  llama:       "A LLAMA?! Adorable... but absolutely NOT allowed! 🦙",
  scissors:    "Snip snip! Very suspicious! No scissors past security! ✂️",
  tire:        "A TYRE?! Were you planning to change a wheel mid-flight?! 🛞",
  waterbottle: "A water bottle? I'll confiscate this... and drink it later! 💧",
};

// --- Beep sound ---

function playBeepSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    [0, 0.5, 1.0].forEach(t => {
      const o = ctx.createOscillator();
      o.connect(gain);
      o.type = 'square';
      o.frequency.value = 880;
      o.start(ctx.currentTime + t);
      o.stop(ctx.currentTime + t + 0.3);
    });
  } catch {}
}

// --- Airport Scene ---

function AirportScene({ character, luggage, packedItems, onBackToRoom, onGoToBeach }) {
  const containerRef = useRef(null);
  const guardRef = useRef(null);
  const bagRef = useRef(null);

  // phase: 'idle' | 'onBelt' | 'bagOpen' | 'noPassport' | 'allClear'
  const [phase, setPhase] = useState('idle');
  const [itemsInBag, setItemsInBag] = useState(packedItems || []);
  const [guardMessage, setGuardMessage] = useState('');
  const quipTimer = useRef(null);

  const showGuardMessage = (msg) => {
    clearTimeout(quipTimer.current);
    setGuardMessage(msg);
  };

  // Conveyor belt zone (% of container)
  const beltZone = { left: 0.55, right: 0.95, top: 0.55, bottom: 0.80 };

  function handleSuitcaseRelease(mx, my) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const inBelt =
      mx >= rect.left + rect.width  * beltZone.left  &&
      mx <= rect.left + rect.width  * beltZone.right &&
      my >= rect.top  + rect.height * beltZone.top   &&
      my <= rect.top  + rect.height * beltZone.bottom;
    if (inBelt) setPhase('onBelt');
  }

  function handleScan() {
    const hasPassport = itemsInBag.some(i => i.mandatory);
    if (!hasPassport) {
      setPhase('noPassport');
      showGuardMessage("Stop! You don't have your passport — you can't fly without it! Go back and pack it! 🛂");
      return;
    }
    const hasBanned = itemsInBag.some(i => !i.allowed);
    if (hasBanned) {
      playBeepSound();
      setPhase('bagOpen');
      showGuardMessage("Please give those bad items to me! 🚨");
    } else {
      setPhase('allClear');
    }
  }

  function handleItemDropOnGuard(item, mx, my) {
    if (!guardRef.current) return;
    const rect = guardRef.current.getBoundingClientRect();
    const over = mx >= rect.left && mx <= rect.right && my >= rect.top && my <= rect.bottom;
    if (!over) return;
    setItemsInBag(prev => prev.filter(p => p.id !== item.id));
    const quip = GUARD_QUIPS[item.id] || `Ooh, a ${item.name}! I'll take that! 😄`;
    showGuardMessage(quip);
  }

  function handlePutBack() {
    setPhase('onBelt'); // Player must scan again to find out if it's clear
    setGuardMessage('');
  }

  return (
    <GameContainer ref={containerRef} bg="#87D4F5">
      <img src={img('scene-airport.png')} alt="Airport" className="absolute inset-0 w-full h-full object-cover" draggable={false} style={{ zIndex: 0, filter: 'brightness(0.97) saturate(0.75)' }} />

      {/* Character — near café */}
      <DraggableSticker image={character.image} name={character.name} initialPos={{ x: 40, y: 58 }} containerRef={containerRef} widthPct={11} baseZ={40} />

      {/* Security guard — bottom right corner */}
      <div ref={guardRef} style={{ position: 'absolute', left: '80%', top: '48%', width: '20%', zIndex: phase === 'bagOpen' ? 200 : 60 }}>
        <img src={img('npc-security.png')} alt="Security Guard" style={{ width: '100%', height: 'auto' }} draggable={false} />
      </div>

      {/* Guard speech bubble */}
      {guardMessage && (
        <div style={{
          position: 'absolute', right: '4%', top: '6%', maxWidth: '26%', zIndex: 200,
          background: 'white', border: '3px solid #1A7AC7', borderRadius: '16px',
          padding: '0.8vw 1.2vw', fontSize: '1.2vw', fontWeight: 700, color: '#1A7AC7',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          {guardMessage}
        </div>
      )}

      {/* Suitcase — draggable to belt */}
      {(phase === 'idle' || phase === 'onBelt') && (
        <DraggableSticker
          image={luggage.imageClosed}
          name={luggage.name}
          initialPos={phase === 'onBelt' ? { x: 65, y: 60 } : { x: 32, y: 62 }}
          containerRef={containerRef}
          widthPct={14}
          heightPct={22}
          baseZ={55}
          onRelease={handleSuitcaseRelease}
        />
      )}

      {/* Scan button — appears when bag is on belt */}
      {phase === 'onBelt' && (
        <button
          onClick={handleScan}
          className="absolute font-black rounded-full transition-all hover:scale-105 active:scale-95"
          style={{ right: '3%', bottom: '3%', zIndex: 90, padding: '0.7vw 1.8vw', background: '#6BCB77', color: 'white', fontSize: '1.5vw', border: '4px solid white', boxShadow: '0 5px 0 #4A9A56' }}
        >
          🔍 Scan Bag
        </button>
      )}

      {/* Open bag view — after scan reveals banned items */}
      {phase === 'bagOpen' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 150, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div ref={bagRef} style={{ position: 'relative', width: '70%', paddingBottom: '42%' }}>
            <img src={luggage.imageOpen} alt="open bag" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 12px 40px rgba(0,0,0,0.5))' }} draggable={false} />
            {/* Items as draggable stickers inside the bag */}
            {itemsInBag.map((item, idx) => {
              const cols = Math.min(itemsInBag.length, 5);
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              return (
                <DraggableSticker
                  key={item.id}
                  image={item.image}
                  name={item.name}
                  initialPos={{ x: 10 + col * (80 / cols), y: 20 + row * 30 }}
                  containerRef={bagRef}
                  widthPct={10}
                  heightPct={10}
                  baseZ={260}
                  onRelease={(mx, my) => handleItemDropOnGuard(item, mx, my)}
                />
              );
            })}
            {/* Put back button */}
            <button
              onClick={handlePutBack}
              className="font-black rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ position: 'absolute', bottom: '-3vw', right: '0', padding: '0.7vw 2vw', background: '#6BCB77', color: 'white', fontSize: '1.4vw', border: '3px solid white', boxShadow: '0 4px 0 #4A9A56' }}
            >
              Done — put bag back on belt →
            </button>
          </div>
        </div>
      )}

      {/* No passport overlay */}
      {phase === 'noPassport' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 150, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2vw' }}>
          <button
            onClick={onBackToRoom}
            className="font-black rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ padding: '1vw 3vw', background: '#FF6B35', color: 'white', fontSize: '2vw', border: '4px solid white', boxShadow: '0 6px 0 #C44D1A' }}
          >
            ← Go back and pack passport!
          </button>
        </div>
      )}

      {/* All clear overlay */}
      {phase === 'allClear' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 150, background: 'rgba(107,203,119,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '2vw' }}>
          <div className="font-black" style={{ fontSize: '5vw', color: 'white', textShadow: '3px 3px 0 #4A9A56' }}>✈️ All clear!</div>
          <button
            onClick={() => onGoToBeach(itemsInBag)}
            className="font-black rounded-full transition-all hover:scale-105 active:scale-95"
            style={{ padding: '1vw 3vw', background: '#FFD166', color: '#7A4F00', fontSize: '2.2vw', border: '4px solid white', boxShadow: '0 6px 0 #C9A000' }}
          >
            🏖️ Off to the beach!
          </button>
        </div>
      )}

    </GameContainer>
  );
}

// --- Beach Scene ---

function BeachScene({ character, luggage, beachItems, packedItems = [], packedCount = 0 }) {
  const containerRef = useRef(null);
  const charRef      = useRef(null);
  const friendRef    = useRef(null);

  // Pick the beach friend — public: always the opposite gender; private: random
  const friend = useRef(
    GAME_MODE === 'public'
      ? PUBLIC_BEACH_FRIEND[character.id] ?? CHARACTERS.find(c => c.id !== character.id)
      : CHARACTERS.filter(c => c.id !== character.id)[Math.floor(Math.random() * (CHARACTERS.length - 1))]
  ).current;

  const [bagOpen, setBagOpen] = useState(false);
  const [itemsReleased, setItemsReleased] = useState(false);
  const [fadingOut, setFadingOut] = useState(false);
  const [showEndMessage, setShowEndMessage] = useState(false);

  // Dress-up: track both character positions and item attachments
  const [charPos,   setCharPos]   = useState({ x: 26, y: 62 });
  const [friendPos, setFriendPos] = useState({ x: 14, y: 62 });
  // attachments: { [itemId]: { who: 'char'|'friend', relX, relY } }
  const [attachments, setAttachments] = useState({});
  // Track which character is being dragged so attached items stay above them
  const [charDragging,   setCharDragging]   = useState(false);
  const [friendDragging, setFriendDragging] = useState(false);

  // Pre-compute scatter positions across the sand — stable across renders
  const itemPositions = useRef(
    beachItems.map((_, i) => ({
      x: 6 + (i % 6) * 14 + (Math.random() * 5 - 2.5),
      y: 64 + Math.floor(i / 6) * 11 + (Math.random() * 3 - 1.5),
    }))
  ).current;

  const handleEndGame = () => {
    setFadingOut(true);
    setTimeout(() => setShowEndMessage(true), 1500);
  };

  const handleBagTap = () => {
    setBagOpen(o => !o);
    if (!itemsReleased) setItemsReleased(true);
  };

  const handleItemRelease = useCallback((itemId, mouseX, mouseY, itemPos) => {
    for (const [who, targetRef, targetPos] of [['char', charRef, charPos], ['friend', friendRef, friendPos]]) {
      if (!targetRef.current) continue;
      const r = targetRef.current.getBoundingClientRect();
      if (mouseX >= r.left && mouseX <= r.right && mouseY >= r.top && mouseY <= r.bottom) {
        // Use the item's top-left position (not the cursor) so it lands exactly
        // where it was visually, just anchored relative to the character.
        setAttachments(prev => ({ ...prev, [itemId]: { who, relX: itemPos.x - targetPos.x, relY: itemPos.y - targetPos.y } }));
        return;
      }
    }
  }, [charPos, friendPos]);

  const handleItemDetach = useCallback((itemId) => {
    setAttachments(prev => { const n = { ...prev }; delete n[itemId]; return n; });
  }, []);

  return (
    <GameContainer ref={containerRef} bg="#87D4F5">
      <img src={img('scene-beach.png')} alt="Beach" className="absolute inset-0 w-full h-full object-cover" draggable={false} style={{ zIndex: 0, filter: 'brightness(0.97) saturate(0.85)' }} />

      {/* Friend */}
      <DraggableSticker ref={friendRef} image={friend.image} name={friend.name} initialPos={{ x: 14, y: 62 }} containerRef={containerRef} widthPct={13} baseZ={40} onMove={setFriendPos} onDragStart={() => setFriendDragging(true)} onDragEnd={() => setFriendDragging(false)} />

      {/* Character */}
      <DraggableSticker ref={charRef} image={character.image} name={character.name} initialPos={{ x: 26, y: 62 }} containerRef={containerRef} widthPct={13} baseZ={40} onMove={setCharPos} onDragStart={() => setCharDragging(true)} onDragEnd={() => setCharDragging(false)} />

      {/* Suitcase — tap to open and burst items out */}
      <DraggableSticker
        image={bagOpen ? luggage.imageOpen : luggage.imageClosed}
        name={luggage.name}
        initialPos={{ x: 70, y: 62 }}
        containerRef={containerRef}
        widthPct={20}
        heightPct={28}
        baseZ={45}
        onTap={handleBagTap}
      />

      {/* Items burst out across the sand when bag is first opened */}
      {itemsReleased && beachItems.map((item, i) => {
        const att = attachments[item.id];
        const anchorPos = att?.who === 'friend' ? friendPos : charPos;
        const ownerDragging = att ? (att.who === 'friend' ? friendDragging : charDragging) : false;
        const controlledPos = att ? { x: anchorPos.x + att.relX, y: anchorPos.y + att.relY } : undefined;
        return (
          <DraggableSticker
            key={item.id}
            image={item.image}
            name={item.name}
            initialPos={itemPositions[i]}
            containerRef={containerRef}
            widthPct={10}
            heightPct={10}
            baseZ={controlledPos ? (ownerDragging ? 1001 : 45) : 50}
            popIn
            controlledPos={controlledPos}
            onDetach={() => handleItemDetach(item.id)}
            onRelease={(mx, my, itemPos) => handleItemRelease(item.id, mx, my, itemPos)}
          />
        );
      })}

      {/* End Game button */}
      <button
        onClick={handleEndGame}
        className="absolute font-black rounded-full transition-all hover:scale-105 active:scale-95"
        style={{ bottom: '3%', right: '2%', padding: '0.8vw 2.2vw', background: '#FF6B35', color: 'white', fontSize: '1.6vw', border: '4px solid white', boxShadow: '0 5px 0 #C44D1A', zIndex: 80 }}
      >
        End Game ★
      </button>

      {/* Fade to black */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 300,
        background: 'black',
        opacity: fadingOut ? 1 : 0,
        transition: 'opacity 1.5s ease',
        pointerEvents: fadingOut ? 'auto' : 'none',
      }} />

      {/* End stats screen */}
      {showEndMessage && (() => {
        const beachIds   = new Set(beachItems.map(i => i.id));
        const confiscated = packedItems.filter(i => !i.allowed);
        const goodItems   = beachItems.filter(i => !i.mandatory);
        const hadPassport = beachItems.some(i => i.mandatory);
        const stars = [
          hadPassport,
          goodItems.length >= 3,
          confiscated.length === 0,
        ].filter(Boolean).length;
        const starLabel = ['Keep practising! 😅', 'Nice packing! 👍', 'Great job! 🎉', 'Perfect packer! 🏆'][stars];

        const statCards = [
          { emoji: '🎒', label: 'Items packed',           value: packedCount,          bg: '#3B82F6', shadow: '#1D4ED8' },
          { emoji: '🏖️', label: 'Made it to the beach',  value: beachItems.length,    bg: '#10B981', shadow: '#047857' },
          { emoji: '🛂', label: 'Passport packed',        value: hadPassport ? '✅' : '❌', bg: hadPassport ? '#6BCB77' : '#EF4444', shadow: hadPassport ? '#4A9A56' : '#B91C1C' },
          { emoji: '😅', label: 'Caught by the guard',    value: confiscated.length,   bg: confiscated.length > 0 ? '#F59E0B' : '#6BCB77', shadow: confiscated.length > 0 ? '#B45309' : '#4A9A56' },
        ];

        return (
          <div style={{ position: 'absolute', inset: 0, zIndex: 400, background: '#0A1628', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1.6vw', padding: '2vw' }}>

            {/* Title */}
            <div style={{ fontSize: '5vw' }}>✈️ 🏖️ 🌴</div>
            <div className="font-black" style={{ fontSize: '4vw', color: '#FFD166', textShadow: '3px 3px 0 #C9A000', textAlign: 'center', lineHeight: 1.1 }}>
              {character.name}'s Holiday Stats!
            </div>

            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.2vw', width: '90%', maxWidth: '900px' }}>
              {statCards.map(({ emoji, label, value, bg, shadow }) => (
                <div key={label} style={{ background: bg, borderRadius: '1.2vw', padding: '1vw 0.8vw', textAlign: 'center', border: '3px solid white', boxShadow: `0 5px 0 ${shadow}` }}>
                  <div style={{ fontSize: '3vw', lineHeight: 1 }}>{emoji}</div>
                  <div className="font-black" style={{ fontSize: '2.8vw', color: 'white', textShadow: '2px 2px 0 rgba(0,0,0,0.3)', lineHeight: 1.1, margin: '0.3vw 0' }}>{value}</div>
                  <div className="font-bold" style={{ fontSize: '1vw', color: 'rgba(255,255,255,0.9)', lineHeight: 1.2 }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Confiscated items list */}
            {confiscated.length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '1vw', padding: '0.8vw 1.5vw', textAlign: 'center' }}>
                <span className="font-bold" style={{ color: '#FCA5A5', fontSize: '1.1vw' }}>Naughty items caught: </span>
                <span className="font-black" style={{ color: 'white', fontSize: '1.1vw' }}>{confiscated.map(i => i.name).join(', ')}</span>
              </div>
            )}

            {/* Star rating */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '3.5vw', letterSpacing: '0.3vw' }}>
                {'⭐'.repeat(stars)}{'🌑'.repeat(3 - stars)}
              </div>
              <div className="font-black" style={{ fontSize: '2vw', color: 'white', textShadow: '2px 2px 0 #1A7AC7', marginTop: '0.4vw' }}>
                {starLabel}
              </div>
            </div>

            {/* Play again */}
            <button
              onClick={() => window.location.reload()}
              className="font-black rounded-full transition-all hover:scale-105 active:scale-95"
              style={{ padding: '0.9vw 3vw', background: '#FFD166', color: '#7A4F00', fontSize: '1.8vw', border: '4px solid white', boxShadow: '0 6px 0 #C9A000', marginTop: '0.5vw' }}
            >
              🔄 Play Again!
            </button>
          </div>
        );
      })()}
    </GameContainer>
  );
}

// --- App ---

const DEBUG_SCREEN = null; // 'start' | 'airport' | 'beach' | null

// 'public'  — players pick girl/boy shape then enter their own name
// 'private' — all 4 named characters shown (Amelka, Clem, Dexter, Riley)
// Switch via URL: ?mode=private  (default is public)
const GAME_MODE = new URLSearchParams(window.location.search).get('mode') === 'private' ? 'private' : 'public';

// Debug bag: always has passport + a spread of offending items + some innocent ones
const DEBUG_ITEMS = [
  ITEMS.find(i => i.id === 'passport'),    // mandatory — must keep this
  ITEMS.find(i => i.id === 'clock'),       // ❌ offending
  ITEMS.find(i => i.id === 'frog'),        // ❌ offending
  ITEMS.find(i => i.id === 'scissors'),    // ❌ offending
  ITEMS.find(i => i.id === 'waterbottle'), // ❌ offending
  ITEMS.find(i => i.id === 'banana'),      // ✅ innocent
  ITEMS.find(i => i.id === 'sunglasses'),  // ✅ innocent
  ITEMS.find(i => i.id === 'socks'),       // ✅ innocent
];

const DEBUG_CHARACTER = CHARACTERS.find(c => c.id === 'amelka');
const DEBUG_LUGGAGE   = LUGGAGE.find(l => l.id === 'suitcase');

export default function App() {
  const [screen, setScreen]       = useState(DEBUG_SCREEN || 'start');
  const [character, setCharacter] = useState(DEBUG_SCREEN ? DEBUG_CHARACTER : null);
  const [luggage, setLuggage]     = useState(DEBUG_SCREEN ? DEBUG_LUGGAGE   : null);
  const [packedCount, setPackedCount] = useState(0);
  const [packedItems, setPackedItems] = useState(DEBUG_SCREEN === 'airport' ? DEBUG_ITEMS : []);
  const [beachItems, setBeachItems]   = useState(DEBUG_SCREEN === 'beach'   ? DEBUG_ITEMS : []);

  if (screen === 'start') {
    return <StartScreen onPlay={() => setScreen('character')} />;
  }

  if (screen === 'character') {
    return (
      <CharacterScreen
        onSelect={(char) => { setCharacter(char); setScreen('luggage'); }}
      />
    );
  }

  if (screen === 'luggage') {
    return (
      <LuggageScreen
        character={character}
        onSelect={(bag) => { setLuggage(bag); setScreen('room'); }}
        onBack={() => setScreen('character')}
      />
    );
  }

  if (screen === 'room') {
    return (
      <RoomScene
        character={character}
        luggage={luggage}
        onGoToAirport={(items) => { setPackedCount(items.length); setPackedItems(items); setScreen('airport'); }}
      />
    );
  }

  if (screen === 'airport') {
    return (
      <AirportScene
        character={character}
        luggage={luggage}
        packedItems={packedItems}
        onBackToRoom={() => setScreen('room')}
        onGoToBeach={(items) => { setBeachItems(items); setScreen('beach'); }}
      />
    );
  }

  if (screen === 'beach') {
    return (
      <BeachScene
        character={character}
        luggage={luggage}
        beachItems={beachItems}
        packedItems={packedItems}
        packedCount={packedCount}
      />
    );
  }

  return null;
}
