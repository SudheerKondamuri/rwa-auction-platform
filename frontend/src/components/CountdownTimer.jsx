import { useState, useEffect } from 'react';
import { formatTimeRemaining, getTimeUrgency } from '../utils/formatters';
import { Clock } from 'lucide-react';

export default function CountdownTimer({ endTime }) {
  const [display, setDisplay] = useState('');
  const [urgency, setUrgency] = useState('normal');

  useEffect(() => {
    const update = () => {
      setDisplay(formatTimeRemaining(endTime));
      setUrgency(getTimeUrgency(endTime));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  const urgencyColors = {
    ended: 'text-text-muted',
    critical: 'text-error animate-pulse font-bold',
    urgent: 'text-warning font-semibold',
    normal: 'text-text-secondary font-medium'
  };

  return (
    <span className={`inline-flex items-center gap-1.5 font-mono text-xs ${urgencyColors[urgency] || urgencyColors.normal}`}>
      <Clock className="w-3.5 h-3.5" />
      <span>{display === 'Ended' ? 'Ended' : display}</span>
    </span>
  );
}
