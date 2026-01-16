type DayTranslations = {
  full: Record<string, string>;
  short: Record<string, string>;
};

export function groupHours(hours: string, dayNames: DayTranslations): string {
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const dayTimeMap: Record<string, string> = {};
  
  const rangePattern = /([A-Za-z]+)\s*-\s*([A-Za-z]+)\s*:\s*(.+?)(?=,|$|\||\n)/gi;
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
        
        for (let i = startIdx; i <= endIdx; i++) {
          dayTimeMap[daysOrder[i]] = timeStr;
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
  } else {
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
  
  if (Object.keys(dayTimeMap).length === 0) {
    return hours;
  }
  
  const groups: { days: string[]; time: string }[] = [];
  
  for (const day of daysOrder) {
    const time = dayTimeMap[day];
    
    if (!time) continue;
    
    const lastGroup = groups[groups.length - 1];
    
    if (lastGroup && lastGroup.time === time) {
      lastGroup.days.push(day);
    } else {
      groups.push({ days: [day], time });
    }
  }
  
  const formattedGroups = groups.map(group => {
    const translatedDays = group.days.map(day => dayNames.short[day] || day.substring(0, 3));
    
    if (translatedDays.length === 1) {
      return `${translatedDays[0]}: ${group.time}`;
    } else if (translatedDays.length === 2) {
      return `${translatedDays[0]}, ${translatedDays[1]}: ${group.time}`;
    } else {
      const firstDay = translatedDays[0];
      const lastDay = translatedDays[translatedDays.length - 1];
      return `${firstDay} - ${lastDay}: ${group.time}`;
    }
  });
  
  return formattedGroups.join(', ');
}
