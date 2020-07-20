import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
  ChangeDetectorRef,
  ViewEncapsulation,
} from "@angular/core";
import { Subject } from "rxjs";
import Hls from "hls.js";
import { LiveStream, VideoDimensions } from './app.models';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom
})
export class AppComponent implements OnInit, OnChanges {

  @Input() stream: LiveStream;

  @Input() streamDim: VideoDimensions;

  @Input() posterUrl: string;

  @Output() focusVideo: EventEmitter<void> = new EventEmitter<void>();

  @Output() showBorder: EventEmitter<boolean> = new EventEmitter<boolean>();

  constructor(public cdr: ChangeDetectorRef) {}

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.

    // In the future, we may have to decide if this is the desired behavior
    if (!!changes["stream"] && this.posterUrl == null && changes["stream"].firstChange) {
      this.setupHls(this.stream);
    }
    if (
      !!changes["stream"] && this.posterUrl == null && !!changes["stream"].previousValue &&
      changes["stream"].currentValue["manifestUrl"] !==
        changes["stream"].previousValue["manifestUrl"]
    ) {
      this.setupHls(this.stream);
    }
    if (!!changes["posterUrl"] && !changes["posterUrl"].currentValue) {
      this.setupHls(this.stream);
    }
  }

  setupHls(stream: LiveStream) {
    let exists = setInterval(function () {
      if (stream && document.querySelector("camio-live-streams").shadowRoot.getElementById("live-stream-" + stream.id)) {
        clearInterval(exists);
        let video = document.querySelector("camio-live-streams").shadowRoot.getElementById(
          "live-stream-" + stream.id
        ) as HTMLVideoElement;
        if (Hls.isSupported()) {
          let hls = new Hls();
          let retries = { network: 0, media: 0 };
          hls.on(Hls.Events.ERROR, (event, data) => {
            // Note: I grabbed this straight from the docs for hls.js
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR && retries.network < 2:
                  // try to recover network error
                  hls.startLoad();
                  retries.network++;
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR && retries.media < 2:
                  hls.recoverMediaError();
                  retries.media++;
                  break;
                default:
                  // cannot recover
                  hls.destroy();
                  break;
              }
            }
          });

          hls.attachMedia(video);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => {
            video.muted = true;
            video.controls = true;
            video.loop = true;
            hls.loadSource(stream.manifestUrl);
            hls.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
              //console.log(data)
            });
          });
        } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = stream.manifestUrl;
        }
      }
    }, 100);
  }
}
