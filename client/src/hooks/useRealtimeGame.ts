import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { toast } from '../lib/toast';

export type GameType = 'tictactoe' | 'canvas' | 'trivia' | 'truth' | 'would' | 'never';

export interface RealtimeGameSession {
  sessionId: string;
  gameType: GameType;
  player1: string; // Naveen UID or name
  player2: string; // Humera UID or name
  currentTurn: string; // UID or 'player1' | 'player2'
  status: 'waiting' | 'active' | 'finished';
  winner: string | null;
  // Tic-Tac-Toe board: 9 elements ('❤️' | '💖' | null)
  tictactoeBoard: Array<string | null>;
  xWins: number;
  oWins: number;
  // Trivia
  triviaIdx: number;
  triviaScore: number;
  // Card games
  todIndex: number;
  wyrIndex: number;
  nhieIndex: number;
  lastMoveBy: string | null;
  updatedAt: string;
}

const DEFAULT_SESSION_ID = 'ou_shared_couple_game_v1';

export function useRealtimeGame(activeGame: GameType) {
  const { currentUser, partnerUser } = useAuth();
  const channelRef = useRef<any>(null);

  const [session, setSession] = useState<RealtimeGameSession>(() => ({
    sessionId: DEFAULT_SESSION_ID,
    gameType: activeGame,
    player1: currentUser?.realName || 'Naveen',
    player2: partnerUser?.realName || 'Humera',
    currentTurn: currentUser?.realName || 'Naveen',
    status: 'active',
    winner: null,
    tictactoeBoard: Array(9).fill(null),
    xWins: 0,
    oWins: 0,
    triviaIdx: 0,
    triviaScore: 0,
    todIndex: 0,
    wyrIndex: 0,
    nhieIndex: 0,
    lastMoveBy: null,
    updatedAt: new Date().toISOString(),
  }));

  const [partnerConnected, setPartnerConnected] = useState(false);

  // Broadcast state change helper
  const broadcastGameState = useCallback((updatedState: Partial<RealtimeGameSession>, eventName = 'GAME_STATE_UPDATE') => {
    if (!channelRef.current) return;

    setSession((prev) => {
      const nextSession = { ...prev, ...updatedState, updatedAt: new Date().toISOString() };
      
      channelRef.current.send({
        type: 'broadcast',
        event: eventName,
        payload: nextSession,
      });

      return nextSession;
    });
  }, []);

  // Initialize Supabase Realtime channel for game synchronization
  useEffect(() => {
    const channelName = `game_room_${DEFAULT_SESSION_ID}`;
    const channel = supabase.channel(channelName, {
      config: { broadcast: { self: false } },
    });

    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'GAME_STATE_UPDATE' }, ({ payload }: { payload: RealtimeGameSession }) => {
        if (payload) {
          setSession(payload);
          setPartnerConnected(true);
        }
      })
      .on('broadcast', { event: 'GAME_INVITE' }, ({ payload }: { payload: { gameType: GameType; sender: string } }) => {
        toast.love(`${payload.sender} started ${payload.gameType}! 🎮`);
        setPartnerConnected(true);
      })
      .on('broadcast', { event: 'CANVAS_STROKE' }, ({ payload }: { payload: any }) => {
        window.dispatchEvent(new CustomEvent('ou_remote_canvas_stroke', { detail: payload }));
      })
      .on('broadcast', { event: 'CANVAS_CLEAR' }, () => {
        window.dispatchEvent(new CustomEvent('ou_remote_canvas_clear'));
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Object.keys(state).length;
        setPartnerConnected(count > 1);
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          channel.track({
            user: currentUser?.realName || 'Player',
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [currentUser]);

  // Tic-Tac-Toe move handler with turn enforcement
  const makeTicTacToeMove = useCallback((idx: number) => {
    const isMyTurn = session.currentTurn === (currentUser?.realName || 'Naveen');
    
    if (!isMyTurn) {
      toast.info("Opponent's turn! Wait for partner to move. ⏳");
      return false;
    }

    if (session.tictactoeBoard[idx] || session.winner) {
      return false;
    }

    const nextSymbol = currentUser?.realName?.toLowerCase().includes('naveen') ? '❤️' : '💖';
    const nextBoard = [...session.tictactoeBoard];
    nextBoard[idx] = nextSymbol;

    // Check winner
    const winLines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    let nextWinner: string | null = null;
    for (const [a, b, c] of winLines) {
      if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
        nextWinner = nextBoard[a];
        break;
      }
    }

    // Check draw
    if (!nextWinner && nextBoard.every((cell) => cell !== null)) {
      nextWinner = 'Draw';
    }

    const nextTurn = partnerUser?.realName || (currentUser?.realName?.toLowerCase().includes('naveen') ? 'Humera' : 'Naveen');
    const newXWins = nextWinner === '❤️' ? session.xWins + 1 : session.xWins;
    const newOWins = nextWinner === '💖' ? session.oWins + 1 : session.oWins;

    broadcastGameState({
      tictactoeBoard: nextBoard,
      currentTurn: nextTurn,
      winner: nextWinner,
      xWins: newXWins,
      oWins: newOWins,
      lastMoveBy: currentUser?.realName || 'Player',
    });

    if (nextWinner) {
      if (nextWinner === 'Draw') toast.info("It's a draw! 🤝");
      else toast.love(`Game Won by ${nextWinner}! 🎉`);
    }

    return true;
  }, [session, currentUser, partnerUser, broadcastGameState]);

  // Reset Tic-Tac-Toe board
  const resetTicTacToe = useCallback((resetScore = false) => {
    broadcastGameState({
      tictactoeBoard: Array(9).fill(null),
      winner: null,
      currentTurn: currentUser?.realName || 'Naveen',
      xWins: resetScore ? 0 : session.xWins,
      oWins: resetScore ? 0 : session.oWins,
    });
    toast.info('Tic-Tac-Toe board reset for both players! 🔄');
  }, [session, currentUser, broadcastGameState]);

  // Card & Trivia Sync Handlers
  const nextTriviaQuestion = useCallback((newScore?: number) => {
    broadcastGameState({
      triviaIdx: (session.triviaIdx + 1) % 3,
      triviaScore: typeof newScore === 'number' ? newScore : session.triviaScore,
    });
  }, [session, broadcastGameState]);

  const nextTruthQuestion = useCallback(() => {
    broadcastGameState({ todIndex: (session.todIndex + 1) % 4 });
  }, [session, broadcastGameState]);

  const nextWouldRather = useCallback(() => {
    broadcastGameState({ wyrIndex: (session.wyrIndex + 1) % 3 });
  }, [session, broadcastGameState]);

  const nextNeverHaveIEver = useCallback(() => {
    broadcastGameState({ nhieIndex: (session.nhieIndex + 1) % 4 });
  }, [session, broadcastGameState]);

  // Canvas Drawing Stroke Broadcast
  const broadcastCanvasStroke = useCallback((strokeData: { x1: number; y1: number; x2: number; y2: number; color: string }) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'CANVAS_STROKE',
        payload: strokeData,
      });
    }
  }, []);

  const broadcastCanvasClear = useCallback(() => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'CANVAS_CLEAR',
      });
    }
  }, []);

  const isMyTurn = session.currentTurn === (currentUser?.realName || 'Naveen');

  return {
    session,
    partnerConnected,
    isMyTurn,
    makeTicTacToeMove,
    resetTicTacToe,
    nextTriviaQuestion,
    nextTruthQuestion,
    nextWouldRather,
    nextNeverHaveIEver,
    broadcastCanvasStroke,
    broadcastCanvasClear,
  };
}
