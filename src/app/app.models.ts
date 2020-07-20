export interface LiveStream {
  id: number;
  currentIndex: number
  manifestUrl: string
  online: boolean,
  cameraName: string
  timeStamp: number
  labels: Array<string>
  isFocused: boolean;
  isSelected: boolean;
}

export interface VideoDimensions {
  width: number;
  height: number;
}