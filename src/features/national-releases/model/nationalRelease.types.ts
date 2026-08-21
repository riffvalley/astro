export type DiscType = 'single' | 'ep' | 'album';

export interface NationalReleaseDiscGenre {
  name: string;
  color?: string;
}

export interface NationalReleaseDisc {
  name?: string;
  image?: string;
  link?: string;
  artist?: { name?: string };
  genre?: NationalReleaseDiscGenre;
}

export interface NationalRelease {
  artistName: string;
  discName: string;
  discType: DiscType;
  genre: string;
  releaseDay: string;
  publishAt?: string;
  link?: string;
  disc?: NationalReleaseDisc;
}

export interface NationalReleaseProposal {
  artistName: string;
  discName: string;
  discType: DiscType;
  genre: string;
  releaseDay: string;
  publishAt?: string;
  link?: string;
}
