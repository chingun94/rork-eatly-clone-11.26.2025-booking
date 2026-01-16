export function isRestaurantOpen(hours: string, date: Date = new Date()): boolean {
  if (!hours || hours.trim() === '') {
    return false;
  }

  const daysOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const currentDay = daysOrder[date.getDay()];
  const currentTime = date.getHours() * 60 + date.getMinutes();

  const dayTimeMap: Record<string, string> = {};
  
  const rangePattern = /([A-Za-z]{3,})\s*-\s*([A-Za-z]{3,})\s*:\s*([^,|\n]+)/gi;
  const rangeMatches = [...hours.matchAll(rangePattern)];
  
  if (rangeMatches.length > 0) {
    for (const match of rangeMatches) {
      const startDayStr = match[1].trim();
      const endDayStr = match[2].trim();
      const timeStr = match[3].trim();
      
      const startDay = daysOrder.find(d => d.toLowerCase().startsWith(startDayStr.toLowerCase()));
      const endDay = daysOrder.find(d => d.toLowerCase().startsWith(endDayStr.toLowerCase()));
      
      if (startDay && endDay) {
        const startIdx = daysOrder.indexOf(startDay);
        const endIdx = daysOrder.indexOf(endDay);
        
        if (startIdx <= endIdx) {
          for (let i = startIdx; i <= endIdx; i++) {
            dayTimeMap[daysOrder[i]] = timeStr;
          }
        } else {
          for (let i = startIdx; i < daysOrder.length; i++) {
            dayTimeMap[daysOrder[i]] = timeStr;
          }
          for (let i = 0; i <= endIdx; i++) {
            dayTimeMap[daysOrder[i]] = timeStr;
          }
        }
      }
    }
  }
  
  const individualPattern = /(?:^|,|\|)\s*([A-Za-z]+)\s*:\s*([^,-]+?)(?=,|$|\||\n)/gi;
  const individualMatches = [...hours.matchAll(individualPattern)];
  
  for (const match of individualMatches) {
    const dayStr = match[1].trim();
    const timeStr = match[2].trim();
    
    if (dayStr.includes('-')) continue;
    
    const day = daysOrder.find(d => d.toLowerCase().startsWith(dayStr.toLowerCase()));
    if (day) {
      dayTimeMap[day] = timeStr;
    }
  }
  
  if (Object.keys(dayTimeMap).length === 0) {
    const lines = hours.split(/[\n,|]/).map(line => line.trim()).filter(line => line);
    
    for (const line of lines) {
      for (const day of daysOrder) {
        const fullDayPattern = new RegExp(`^${day}:?\\s*(.+)$`, 'i');
        const shortDayPattern = new RegExp(`^${day.substring(0, 3)}:?\\s*(.+)$`, 'i');
        
        let match = line.match(fullDayPattern);
        if (!match) {
          match = line.match(shortDayPattern);
        }
        
        if (match) {
          dayTimeMap[day] = match[1].trim();
          break;
        }
      }
    }
  }

  const todayHours = dayTimeMap[currentDay];
  
  if (!todayHours) {
    console.log('[isRestaurantOpen] ❌ No hours found for', currentDay);
    console.log('[isRestaurantOpen] dayTimeMap:', JSON.stringify(dayTimeMap, null, 2));
    return false;
  }

  const closedPattern = /closed|хаалттай/i;
  if (closedPattern.test(todayHours)) {
    return false;
  }

  const timeRangePattern = /(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\s*[-–—]\s*(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?/i;
  const match = todayHours.match(timeRangePattern);
  
  if (!match) {
    console.log('[isRestaurantOpen] ❌ No time pattern match for today hours:', todayHours);
    console.log('[isRestaurantOpen] Hours string characters:', Array.from(todayHours).map(c => `${c}(${c.charCodeAt(0)})`).join(' '));
    return false;
  }

  const parseTime = (hour: string, minute: string, meridiem: string | undefined): number => {
    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    
    if (isNaN(h) || isNaN(m)) {
      console.error('[isRestaurantOpen] Invalid time values:', { hour, minute, h, m });
      return 0;
    }
    
    let finalHour = h;
    
    if (meridiem) {
      const meridLower = meridiem.toLowerCase();
      if (meridLower === 'pm' && finalHour !== 12) {
        finalHour += 12;
      } else if (meridLower === 'am' && finalHour === 12) {
        finalHour = 0;
      }
    }
    
    return finalHour * 60 + m;
  };

  const openTime = parseTime(match[1], match[2], match[3]);
  const closeTime = parseTime(match[4], match[5], match[6]);

  console.log('[isRestaurantOpen] ==================');
  console.log('[isRestaurantOpen] Full input:', hours);
  console.log('[isRestaurantOpen] Current day:', currentDay);
  console.log('[isRestaurantOpen] Today hours:', todayHours);
  console.log('[isRestaurantOpen] Current time:', `${Math.floor(currentTime / 60)}:${String(currentTime % 60).padStart(2, '0')}`);
  console.log('[isRestaurantOpen] Open time:', `${Math.floor(openTime / 60)}:${String(openTime % 60).padStart(2, '0')}`);
  console.log('[isRestaurantOpen] Close time:', `${Math.floor(closeTime / 60)}:${String(closeTime % 60).padStart(2, '0')}`);

  if (closeTime < openTime) {
    const result = currentTime >= openTime || currentTime < closeTime;
    console.log('[isRestaurantOpen] ✅ Cross-midnight - Result:', result);
    console.log('[isRestaurantOpen] ==================');
    return result;
  }

  const result = currentTime >= openTime && currentTime < closeTime;
  console.log('[isRestaurantOpen] ✅ Normal check - Result:', result);
  console.log('[isRestaurantOpen] ==================');
  return result;
}
