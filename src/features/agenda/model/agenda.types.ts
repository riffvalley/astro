export interface RegionCalendar {
  name: string;
  id: string;
  color: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  location: string | null;
  htmlLink: string;
  calendarName: string;
  calendarColor: string;
}

export interface MapShape {
  id: string;
  calendarName: string;
  d: string;
}

export interface SpainMap {
  width: number;
  height: number;
  shapes: MapShape[];
  compositionBorder: string;
}
