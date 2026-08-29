import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { toast } from '../lib/toast';
import { UserProfile } from '../types';

export type GameType = 'tictactoe' | 'canvas' | 'trivia' | 'truth' | 'would' | 'never' | 'wordle' | 'compat';

export interface RealtimeGameSession {
  sessionId: string;
  gameType: GameType;
  player1Uid: string;
  player2Uid: string;
  player1Name: string;
  player2Name: string;
  currentTurnUid: string;
  status: 'waiting' | 'active' | 'finished';
  winnerUid: string | 'draw' | null;
  // Tic-Tac-Toe board: 9 elements ('X' | 'O' | '❤️' | '⭐' | null)
  tictactoeBoard: Array<string | null>;
  p1Wins: number;
  p2Wins: number;
  draws: number;
  // Trivia & card indexes
  triviaIdx: number;
  triviaScore: number;
  todIndex: number;
  wyrIndex: number;
  nhieIndex: number;
  lastMoveBy: string | null;
  updatedAt: string;
}

export function useRealtimeGame(activeGame: GameType, opponent?: UserProfile | null) {
  const { currentUser, partnerUser } = useAuth();
  const currentOpponent = opponent || partnerUser;

  const player1Uid = currentUser?.uid || 'user_1';
  const player2Uid = currentOpponent?.uid || 'user_2';
  const sessionId = `game_${[player1Uid, player2Uid].sort().join('_')}`;

  const channelRef = useRef<any>(null);

  const [session, setSession] = useState<RealtimeGameSession>(() => ({
    sessionId,
    gameType: activeGame,
    player1Uid,
    player2Uid,
    player1Name: currentUser?.displayName || currentUser?.username || 'Player 1',
    player2Name: currentOpponent?.displayName || currentOpponent?.username || 'Player 2',
    currentTurnUid: player1Uid,
    status: 'active',
    winnerUid: null,
    tictactoeBoard: Array(9).fill(null),
    p1Wins: 0,
    p2Wins: 0,
    draws: 0,
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
    setSession((prev) => {
      const nextSession = { ...prev, ...updatedState, updatedAt: new Date().toISOString() };
      
      if (channelRef.current && isSupabaseConfigured()) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: eventName,
            payload: nextSession,
          }).catch(() => {});
        } catch (_) {}
      }

      return nextSession;
    });
  }, []);

  // Initialize Supabase Realtime channel for game synchronization
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const channelName = `game_room_${sessionId}`;
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
      .on('broadcast', { event: 'GAME_INVITE' }, ({ payload }: { payload: { gameType: GameType; senderName: string } }) => {
        toast.love(`${payload.senderName} invited you to play ${payload.gameType}! 🎮`);
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
            user: currentUser?.displayName || currentUser?.username || 'Player',
            onlineAt: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [sessionId, currentUser]);

  // Tic-Tac-Toe move handler with dynamic turn enforcement
  const makeTicTacToeMove = useCallback((idx: number) => {
    const myUid = currentUser?.uid || 'user_1';
    const isMyTurn = session.currentTurnUid === myUid;
    
    if (!isMyTurn) {
      toast.info("Opponent's turn! Please wait. ⏳");
      return false;
    }

    if (session.tictactoeBoard[idx] || session.winnerUid) {
      return false;
    }

    // Player 1 is ❤️, Player 2 is ⭐
    const isP1 = myUid === session.player1Uid;
    const mySymbol = isP1 ? '❤️' : '⭐';
    const nextBoard = [...session.tictactoeBoard];
    nextBoard[idx] = mySymbol;

    // Check winner lines
    const winLines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];

    let winnerUid: string | 'draw' | null = null;
    for (const [a, b, c] of winLines) {
      if (nextBoard[a] && nextBoard[a] === nextBoard[b] && nextBoard[a] === nextBoard[c]) {
        winnerUid = myUid;
        break;
      }
    }

    // Check draw
    if (!winnerUid && nextBoard.every((cell) => cell !== null)) {
      winnerUid = 'draw';
    }

    const nextTurnUid = isP1 ? session.player2Uid : session.player1Uid;

    let p1Wins = session.p1Wins;
    let p2Wins = session.p2Wins;
    let draws = session.draws;

    if (winnerUid === session.player1Uid) p1Wins += 1;
    else if (winnerUid === session.player2Uid) p2Wins += 1;
    else if (winnerUid === 'draw') draws += 1;

    broadcastGameState({
      tictactoeBoard: nextBoard,
      currentTurnUid: nextTurnUid,
      winnerUid,
      p1Wins,
      p2Wins,
      draws,
      lastMoveBy: myUid,
    });

    return true;
  }, [session, currentUser, broadcastGameState]);

  // Reset Tic-Tac-Toe board for rematch
  const resetTicTacToe = useCallback(() => {
    broadcastGameState({
      tictactoeBoard: Array(9).fill(null),
      winnerUid: null,
      currentTurnUid: session.player1Uid,
      lastMoveBy: null,
    });
    toast.love('Rematch started! 🎮');
  }, [session.player1Uid, broadcastGameState]);

  // Sync Trivia & Card game steps
  const nextTrivia = useCallback((isCorrect: boolean) => {
    broadcastGameState({
      triviaIdx: session.triviaIdx + 1,
      triviaScore: isCorrect ? session.triviaScore + 10 : session.triviaScore,
    });
  }, [session.triviaIdx, session.triviaScore, broadcastGameState]);

  const isMyTurn = session.currentTurnUid === (currentUser?.uid || 'user_1');

  const broadcastCanvasStroke = useCallback((stroke: { x1: number; y1: number; x2: number; y2: number; color?: string }) => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'CANVAS_STROKE',
      payload: stroke,
    });
  }, []);

  const broadcastCanvasClear = useCallback(() => {
    if (!channelRef.current) return;
    channelRef.current.send({
      type: 'broadcast',
      event: 'CANVAS_CLEAR',
      payload: {},
    });
  }, []);

  const nextTriviaQuestion = useCallback((score?: number) => {
    broadcastGameState({
      triviaIdx: session.triviaIdx + 1,
      triviaScore: score !== undefined ? score : session.triviaScore,
    });
  }, [session.triviaIdx, session.triviaScore, broadcastGameState]);

  const nextCard = useCallback((deckType: 'tod' | 'wyr' | 'nhie', maxLen: number) => {
    const key = deckType === 'tod' ? 'todIndex' : deckType === 'wyr' ? 'wyrIndex' : 'nhieIndex';
    const safeLen = maxLen > 0 ? maxLen : 1;
    const nextVal = ((session[key] ?? 0) + 1) % safeLen;
    broadcastGameState({ [key]: nextVal });
  }, [session, broadcastGameState]);

  const nextTruthQuestion = useCallback((maxLen: number) => {
    nextCard('tod', maxLen);
  }, [nextCard]);

  const nextWouldRather = useCallback((maxLen: number) => {
    nextCard('wyr', maxLen);
  }, [nextCard]);

  const nextNeverHaveIEver = useCallback((maxLen: number) => {
    nextCard('nhie', maxLen);
  }, [nextCard]);

  return {
    session,
    partnerConnected,
    isMyTurn,
    makeTicTacToeMove,
    resetTicTacToe,
    nextTrivia,
    nextTriviaQuestion,
    nextTruthQuestion,
    nextWouldRather,
    nextNeverHaveIEver,
    broadcastCanvasStroke,
    broadcastCanvasClear,
    nextCard,
    broadcastGameState,
  };
}

