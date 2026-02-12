type CaptionImage = {
  id: string;
  url: string | null;
  image_description: string | null;
};

export type Caption = {
  id: string;
  content: string | null;
  like_count: number;
  image: CaptionImage;
};
