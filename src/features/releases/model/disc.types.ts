export interface DiscGenre {
  id: string;
  name: string;
  color?: string;
}

export interface DiscCountry {
  id: string;
  name: string;
}

export interface DiscArtist {
  name?: string;
  country?: DiscCountry;
}

export interface Disc {
  id: string;
  name: string;
  image?: string;
  link?: string;
  debut?: boolean;
  ep?: boolean;
  releaseDate: string;
  artist?: DiscArtist;
  genre?: DiscGenre;
}

export interface DiscDateGroup {
  releaseDate: string;
  discs: Disc[];
}

export interface FilterOption {
  id: string;
  name: string;
}
