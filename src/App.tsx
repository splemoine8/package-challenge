import { useState, useEffect } from 'react';
import { doc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from './config/firebase';
import { formatDistanceToNow, format, differenceInSeconds } from 'date-fns';
import Confetti from 'react-confetti';
import { Routes, Route, Navigate } from 'react-router-dom';

interface ChallengeData {
  startTime: any;
  pancakes: number;
  baconStrips: number;
  helperPancakes: number;
  sausageLinks: number;
  isActive: boolean;
}

// Helper function to format minutes to "X hours, X minutes"
const formatMinutesToReadable = (totalMinutes: number) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours === 0) {
    return `${minutes} minutes`;
  } else if (minutes === 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  } else {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}, ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  }
};

// Helper function to calculate time remaining
const calculateTimeRemaining = (challengeData: ChallengeData | null, currentTime: Date) => {
  if (!challengeData?.startTime || !challengeData.isActive) return { text: 'Challenge not started', minutes: 0, percentComplete: 0, countdownText: '24:00:00' };
  
  const startTime = challengeData.startTime.toDate();
  const totalSeconds = 24 * 60 * 60; // 24 hours in seconds
  
  // Calculate time reduction from food items
  const pancakeReduction = challengeData.pancakes * 60 * 60; // 1 hour per pancake in seconds
  const baconReduction = Math.floor(challengeData.baconStrips / 2) * 15 * 60; // 15 mins per 2 strips in seconds
  const sausageReduction = Math.floor(challengeData.sausageLinks / 2) * 15 * 60; // 15 mins per 2 links in seconds
  const helperReduction = challengeData.helperPancakes * 30 * 60; // 30 mins per leaguemate pancake in seconds
  
  // Calculate elapsed time since challenge started
  const elapsedSeconds = differenceInSeconds(currentTime, startTime);
  
  // Total time reduction (food items + elapsed time)
  const totalReduction = pancakeReduction + baconReduction + sausageReduction + helperReduction + elapsedSeconds;
  const remainingSeconds = Math.max(0, totalSeconds - totalReduction);
  
  if (remainingSeconds <= 0) return { 
    text: 'Challenge Complete!', 
    minutes: 0, 
    percentComplete: 100,
    countdownText: '00:00:00'
  };
  
  // Format countdown timer (HH:MM:SS)
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;
  const countdownText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Calculate percent complete based on total seconds
  const percentComplete = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;
  
  // For the fuzzy text display, we'll use the remaining minutes
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const endTime = new Date(currentTime.getTime() + remainingMinutes * 60000);
  
  return { 
    text: formatDistanceToNow(endTime, { addSuffix: true }),
    minutes: remainingMinutes,
    percentComplete,
    countdownText
  };
};

// Helper function to calculate total time reduction
const calculateTotalTimeReduction = (data: ChallengeData) => {
  const pancakeReduction = data.pancakes * 60; // 1 hour per pancake
  const baconReduction = Math.floor(data.baconStrips / 2) * 15; // 15 mins per 2 strips
  const sausageReduction = Math.floor(data.sausageLinks / 2) * 15; // 15 mins per 2 links
  const helperReduction = data.helperPancakes * 30; // 30 mins per leaguemate pancake
  
  return pancakeReduction + baconReduction + sausageReduction + helperReduction;
};

// Helper function to calculate calories
const calculateCalories = (data: ChallengeData) => {
  const pancakeCalories = data.pancakes * 240; // 240 calories per pancake
  const baconCalories = data.baconStrips * 52.5; // 52.5 calories per bacon strip
  const sausageCalories = data.sausageLinks * 80; // 80 calories per sausage link
  
  return Math.round(pancakeCalories + baconCalories + sausageCalories);
};

// Styles
const containerStyle = {
  padding: '20px',
  maxWidth: '800px',
  width: '100%',
  margin: '0 auto',
  backgroundColor: 'white',
  fontFamily: 'Arial, sans-serif',
  borderRadius: '8px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  backgroundImage: 'linear-gradient(45deg, #fff 25%, #f9f9f9 25%, #f9f9f9 50%, #fff 50%, #fff 75%, #f9f9f9 75%, #f9f9f9)',
  backgroundSize: '20px 20px',
  boxSizing: 'border-box' as const
};

// Denny's branding styles
const dennysTitleContainerStyle = {
  position: 'relative' as const,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  marginBottom: '30px',
  marginTop: '10px',
  flexWrap: 'wrap' as const
};

const dennysBadgeStyle = {
  display: 'inline-block',
  padding: '15px 40px',
  backgroundColor: '#FFD200', // Denny's yellow
  color: '#D7001C', // Denny's red
  fontFamily: '"Fjalla One", "Anton", sans-serif',
  fontSize: 'clamp(1.5rem, 5vw, 2.2rem)',
  fontWeight: 'bold',
  letterSpacing: '-0.5px',
  textTransform: 'uppercase' as const,
  textShadow: '0.5px 0.5px 0px rgba(0,0,0,0.3)',
  transform: 'rotate(0deg)',
  animation: 'flipIn 0.7s cubic-bezier(0.23, 1, 0.32, 1.2) forwards',
  clipPath: 'polygon(10% 0%, 90% 0%, 100% 50%, 90% 100%, 10% 100%, 0% 50%)',
  backgroundImage: 'linear-gradient(to bottom, #fff4 0%, #fff1 50%, #0002 100%)',
  textAlign: 'center' as const
};

const buttonStyle = {
  marginTop: '16px',
  backgroundColor: '#D7001C', // Denny's red
  color: 'white',
  padding: '12px 16px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold' as const,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  fontFamily: '"Fjalla One", "Anton", sans-serif',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  transition: 'transform 0.2s, box-shadow 0.2s',
  whiteSpace: 'nowrap' as const,
  fontSize: 'clamp(0.9rem, 3vw, 1rem)'
};

const dangerButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#444',
  marginLeft: '10px'
};

const cardStyle = {
  padding: '16px',
  border: '1px solid #ddd',
  borderRadius: '8px',
  marginTop: '16px',
  backgroundColor: 'white',
  boxShadow: '0 3px 6px rgba(0,0,0,0.1)',
  backgroundImage: 'linear-gradient(to bottom, #fff 0%, #f9f9f9 100%)',
  width: '100%',
  boxSizing: 'border-box' as const
};

const buttonGroupStyle = {
  display: 'flex',
  gap: '10px',
  marginTop: '16px',
  flexWrap: 'wrap' as const,
  justifyContent: 'center' as const
};

const progressContainerStyle = {
  width: '100%',
  height: '20px',
  backgroundColor: '#E2E8F0',
  borderRadius: '10px',
  overflow: 'hidden',
  marginTop: '12px'
};

const foodItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
  flexWrap: 'wrap' as const
};

const clockStyle = {
  fontSize: '0.9em',
  color: '#718096',
  textAlign: 'center' as const,
  marginTop: '8px'
};

// Styles for the disabled button
const disabledButtonStyle = {
  ...buttonStyle,
  backgroundColor: '#cccccc',
  color: '#666666',
  opacity: 0.7,
  cursor: 'not-allowed' as const,
  pointerEvents: 'none' as const,
  boxShadow: 'none'
};

function PublicView() {
  console.log('Rendering PublicView');
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    // Listen for changes in the challenge document
    const unsubscribe = onSnapshot(doc(db, 'challenge', 'current'), (doc) => {
      if (doc.exists()) {
        setChallengeData(doc.data() as ChallengeData);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const timeInfo = calculateTimeRemaining(challengeData, currentTime);
  const isCompleted = timeInfo.minutes <= 0 && challengeData?.isActive;

  // Show celebration animation
  useEffect(() => {
    if (isCompleted) {
      setShowCelebration(true);
    } else {
      setShowCelebration(false);
    }
  }, [isCompleted]);

  return (
    <div style={containerStyle}>
      {isCompleted && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      
      <div style={dennysTitleContainerStyle}>
        <div style={dennysBadgeStyle}>
          Death by Denny's
        </div>
      </div>

      <div style={clockStyle}>
        Current Time: {format(currentTime, 'h:mm:ss a, MMMM do yyyy')}
      </div>
      
      {challengeData?.isActive && (
        <>
          {isCompleted && (
            <div style={{
              padding: '20px',
              marginTop: '16px',
              backgroundColor: '#C6F6D5',
              borderRadius: '8px',
              textAlign: 'center',
              animation: showCelebration ? 'pulse 1.5s infinite' : 'none'
            }}>
              <h2 style={{ color: '#2F855A', marginBottom: '8px', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>🏆 PUNISHMENT COMPLETED! 🏆</h2>
              <p style={{ marginTop: '10px', fontSize: 'clamp(0.9rem, 3vw, 1.2em)' }}>
                Total items consumed:
                <strong> {challengeData.pancakes}</strong> pancakes,
                <strong> {challengeData.baconStrips}</strong> bacon strips, and
                <strong> {challengeData.helperPancakes}</strong> leaguemate pancakes
              </p>
            </div>
          )}

          <div style={cardStyle}>
            <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5em)', marginBottom: '8px' }}>
              {isCompleted ? '🎉 Punishment Complete! 🎉' : 'Time Remaining:'}
            </h2>
            
            <div style={{ 
              fontSize: 'clamp(1.5rem, 6vw, 2em)',  
              fontWeight: 'bold', 
              textAlign: 'center', 
              margin: '10px 0', 
              fontFamily: 'monospace',
              color: isCompleted ? '#48BB78' : 'inherit'
            }}>
              {timeInfo.countdownText}
            </div>
            
            <div style={progressContainerStyle}>
              <div style={{
                width: `${timeInfo.percentComplete}%`,
                height: '100%',
                backgroundColor: timeInfo.percentComplete > 75 ? '#48BB78' : 
                                 timeInfo.percentComplete > 50 ? '#4299E1' :
                                 timeInfo.percentComplete > 25 ? '#ECC94B' : '#F56565',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8em' }}>
              <span>Start</span>
              <span>Punishment Complete</span>
            </div>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginBottom: '12px', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>Current Count:</h3>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🥞</span>
                <span>Pancakes eaten: <strong>{challengeData.pancakes}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>-{challengeData.pancakes} hr</span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🥓</span>
                <span>Bacon strips eaten: <strong>{challengeData.baconStrips}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                -{Math.floor(challengeData.baconStrips / 2) * 15} min
              </span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🌭</span>
                <span>Sausage links eaten: <strong>{challengeData.sausageLinks}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                -{Math.floor(challengeData.sausageLinks / 2) * 15} min
              </span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🤝</span>
                <span>Leaguemate pancakes: <strong>{challengeData.helperPancakes}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                -{challengeData.helperPancakes * 30} min
              </span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between', borderTop: '1px dashed #ddd', paddingTop: '8px', marginTop: '4px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>💀</span>
                <span>Calories consumed:</span>
              </div>
              <span style={{ fontWeight: 'bold', color: '#DD6B20' }}>
                {calculateCalories(challengeData)}
              </span>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '8px', 
              backgroundColor: '#EBF8FF', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap' as const,
              gap: '8px'
            }}>
              <span>Total time reduction:</span>
              <span style={{ fontWeight: 'bold' }}>
                {formatMinutesToReadable(calculateTotalTimeReduction(challengeData))}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AdminView() {
  console.log('Rendering AdminView');
  const [challengeData, setChallengeData] = useState<ChallengeData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [showCelebration, setShowCelebration] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    // Listen for changes in the challenge document
    const unsubscribe = onSnapshot(doc(db, 'challenge', 'current'), (doc) => {
      if (doc.exists()) {
        setChallengeData(doc.data() as ChallengeData);
      }
    });

    return () => unsubscribe();
  }, []);

  // Update window size for confetti
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setWindowSize({
        width,
        height,
      });
      
      setIsMobile(width <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const startChallenge = async () => {
    try {
      await setDoc(doc(db, 'challenge', 'current'), {
        startTime: serverTimestamp(),
        pancakes: challengeData?.pancakes || 0,
        baconStrips: challengeData?.baconStrips || 0,
        helperPancakes: challengeData?.helperPancakes || 0,
        sausageLinks: challengeData?.sausageLinks || 0,
        isActive: true
      }, { merge: true });
      
      console.log('Challenge started!');
    } catch (error) {
      console.error('Error starting challenge:', error);
      setError('Failed to start challenge. Please try again.');
    }
  };

  const resetChallenge = async () => {
    if (confirm('Are you sure you want to reset the challenge? This will clear all current data.')) {
      try {
        await setDoc(doc(db, 'challenge', 'current'), {
          startTime: null,
          pancakes: 0,
          baconStrips: 0,
          helperPancakes: 0,
          sausageLinks: 0,
          isActive: false
        });
      } catch (error) {
        console.error('Error resetting challenge:', error);
        setError('Failed to reset challenge. Please try again.');
      }
    }
  };

  const addItem = async (type: 'pancakes' | 'baconStrips' | 'helperPancakes' | 'sausageLinks') => {
    if (!challengeData?.isActive) return;
    
    try {
      await setDoc(doc(db, 'challenge', 'current'), {
        ...challengeData,
        [type]: challengeData[type] + 1
      }, { merge: true });
    } catch (error) {
      console.error('Error updating challenge:', error);
      setError('Failed to update data. Please try again.');
    }
  };

  const timeInfo = calculateTimeRemaining(challengeData, currentTime);
  const isCompleted = timeInfo.minutes <= 0 && challengeData?.isActive;

  // Show celebration animation
  useEffect(() => {
    if (isCompleted) {
      setShowCelebration(true);
    } else {
      setShowCelebration(false);
    }
  }, [isCompleted]);

  // Button components with responsive text
  const renderButtonText = (emoji: string, text: string) => {
    return isMobile ? emoji : `${emoji} ${text}`;
  };

  return (
    <div style={containerStyle}>
      {isCompleted && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={500}
          gravity={0.3}
        />
      )}
      
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#D7001C',
        color: 'white',
        textAlign: 'center',
        padding: '4px',
        fontSize: '0.8em',
        zIndex: 1000,
      }}>
        Admin View
      </div>

      <div style={{ ...dennysTitleContainerStyle, marginTop: '30px' }}>
        <div style={dennysBadgeStyle}>
          Death by Denny's
          <div style={{ 
            fontSize: '0.6em',
            marginTop: '4px',
            backgroundColor: '#D7001C',
            color: 'white',
            padding: '2px 8px',
            borderRadius: '4px',
            display: 'inline-block'
          }}>
            ADMIN MODE
          </div>
        </div>
      </div>

      <div style={clockStyle}>
        Current Time: {format(currentTime, 'h:mm:ss a, MMMM do yyyy')}
      </div>
      
      {error && (
        <div style={{ padding: '10px', backgroundColor: '#FED7D7', color: '#822727', marginBottom: '16px', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      {/* Control buttons for admin - always visible */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%', 
        gap: '10px', 
        marginTop: '16px',
        flexWrap: 'wrap'
      }}>
        <button 
          style={challengeData?.isActive ? disabledButtonStyle : buttonStyle} 
          onClick={startChallenge}
          title={challengeData?.isActive ? "Challenge already in progress" : "Start Challenge"}
          disabled={challengeData?.isActive}
        >
          {renderButtonText('🏁', 'Start Challenge')}
        </button>
        
        <button 
          style={{...dangerButtonStyle, marginLeft: 0}}
          onClick={resetChallenge}
          title="Reset Challenge without starting"
        >
          {renderButtonText('🔄', 'Reset Data')}
        </button>
      </div>

      {challengeData?.isActive && (
        <>
          {isCompleted && (
            <div style={{
              padding: '20px',
              marginTop: '16px',
              backgroundColor: '#C6F6D5',
              borderRadius: '8px',
              textAlign: 'center',
              animation: showCelebration ? 'pulse 1.5s infinite' : 'none'
            }}>
              <h2 style={{ color: '#2F855A', marginBottom: '8px', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}>🏆 PUNISHMENT COMPLETED! 🏆</h2>
              <p style={{ marginTop: '10px', fontSize: 'clamp(0.9rem, 3vw, 1.2em)' }}>
                Total items consumed:
                <strong> {challengeData.pancakes}</strong> pancakes,
                <strong> {challengeData.baconStrips}</strong> bacon strips, and
                <strong> {challengeData.helperPancakes}</strong> leaguemate pancakes
              </p>
            </div>
          )}

          <div style={cardStyle}>
            <h2 style={{ fontSize: 'clamp(1.2rem, 4vw, 1.5em)', marginBottom: '8px' }}>
              {isCompleted ? '🎉 Punishment Complete! 🎉' : 'Time Remaining:'}
            </h2>
            
            <div style={{ 
              fontSize: 'clamp(1.5rem, 6vw, 2em)', 
              fontWeight: 'bold', 
              textAlign: 'center', 
              margin: '10px 0', 
              fontFamily: 'monospace',
              color: isCompleted ? '#48BB78' : 'inherit'
            }}>
              {timeInfo.countdownText}
            </div>
            
            <div style={progressContainerStyle}>
              <div style={{
                width: `${timeInfo.percentComplete}%`,
                height: '100%',
                backgroundColor: timeInfo.percentComplete > 75 ? '#48BB78' : 
                                 timeInfo.percentComplete > 50 ? '#4299E1' :
                                 timeInfo.percentComplete > 25 ? '#ECC94B' : '#F56565',
                transition: 'width 0.5s ease-in-out'
              }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.8em' }}>
              <span>Start</span>
              <span>Punishment Complete</span>
            </div>
          </div>

          <div style={buttonGroupStyle}>
            <button 
              style={{...buttonStyle, flex: '1', minWidth: isMobile ? '80px' : '120px', maxWidth: isMobile ? '100px' : '200px'}}
              onClick={() => addItem('pancakes')}
              title="Add Pancake (-1 hour)"
            >
              {renderButtonText('🥞', 'Add Pancake (-1 hour)')}
            </button>
            <button 
              style={{...buttonStyle, backgroundColor: '#FFD200', color: '#000', flex: '1', minWidth: isMobile ? '80px' : '120px', maxWidth: isMobile ? '100px' : '200px'}}
              onClick={() => addItem('baconStrips')}
              title="Add Bacon (-15 min per 2)"
            >
              {renderButtonText('🥓', 'Add Bacon (-15 min per 2)')}
            </button>
            <button 
              style={{...buttonStyle, backgroundColor: '#8B4513', color: '#FFF', flex: '1', minWidth: isMobile ? '80px' : '120px', maxWidth: isMobile ? '100px' : '200px'}}
              onClick={() => addItem('sausageLinks')}
              title="Add Sausage (-15 min per 2)"
            >
              {renderButtonText('🌭', 'Add Sausage (-15 min per 2)')}
            </button>
            <button 
              style={{...buttonStyle, backgroundColor: '#0070DD', flex: '1', minWidth: isMobile ? '80px' : '120px', maxWidth: isMobile ? '100px' : '200px'}}
              onClick={() => addItem('helperPancakes')}
              title="Add Leaguemate Pancake (-30 min)"
            >
              {renderButtonText('🤝', 'Add Leaguemate Pancake (-30 min)')}
            </button>
          </div>

          <div style={cardStyle}>
            <h3 style={{ marginBottom: '12px', fontSize: 'clamp(1rem, 3vw, 1.2rem)' }}>Current Count:</h3>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🥞</span>
                <span>Pancakes eaten: <strong>{challengeData.pancakes}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>-{challengeData.pancakes} hr</span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🥓</span>
                <span>Bacon strips eaten: <strong>{challengeData.baconStrips}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                -{Math.floor(challengeData.baconStrips / 2) * 15} min
              </span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🌭</span>
                <span>Sausage links eaten: <strong>{challengeData.sausageLinks}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                -{Math.floor(challengeData.sausageLinks / 2) * 15} min
              </span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>🤝</span>
                <span>Leaguemate pancakes: <strong>{challengeData.helperPancakes}</strong></span>
              </div>
              <span style={{ color: '#E53E3E', fontWeight: 'bold' }}>
                -{challengeData.helperPancakes * 30} min
              </span>
            </div>
            
            <div style={{...foodItemStyle, justifyContent: 'space-between', borderTop: '1px dashed #ddd', paddingTop: '8px', marginTop: '4px'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <span style={{ fontSize: '1.5em' }}>💀</span>
                <span>Calories consumed:</span>
              </div>
              <span style={{ fontWeight: 'bold', color: '#DD6B20' }}>
                {calculateCalories(challengeData)}
              </span>
            </div>
            
            <div style={{ 
              marginTop: '16px', 
              padding: '8px', 
              backgroundColor: '#EBF8FF', 
              borderRadius: '4px',
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap' as const,
              gap: '8px'
            }}>
              <span>Total time reduction:</span>
              <span style={{ fontWeight: 'bold' }}>
                {formatMinutesToReadable(calculateTotalTimeReduction(challengeData))}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function App() {
  console.log('Rendering App, current path:', window.location.pathname);
  return (
    <Routes>
      <Route path="/" element={<PublicView />} />
      <Route path="/admin" element={<AdminView />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default App;
