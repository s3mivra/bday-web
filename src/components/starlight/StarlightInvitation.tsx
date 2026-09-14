import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import {
  Bell,
  Church,
  CircleCheck,
  Clock,
  ExternalLink,
  Gift,
  Heart,
  Info,
  MapPin,
  Pause,
  Play,
  PartyPopper,
  Shirt,
  Sparkles,
} from 'lucide-react';
import { Envelope } from '@/components/starlight/Envelope';
import { StarField } from '@/components/starlight/StarField';
import { useCountdown } from '@/hooks/useCountdown';
import { useReveal } from '@/hooks/useReveal';
import {
  formatLongDate,
  formatTime,
  mapsEmbedUrlFor,
  mapsUrlFor,
  parseDateOnly,
  safeExternalUrl,
  toLocalDateTime,
} from '@/lib/utils';
import type { EventSettings, HeroSettings, InvitationSettings } from '@/types';
import '@/components/starlight/starlight.css';

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,400&family=Sacramento&family=Quicksand:wght@400;500;600&display=swap';

/** Loads the Starlight fonts only when this theme is in use. */
function useStarlightFonts() {
  useEffect(() => {
    if (document.querySelector(`link[href="${FONT_HREF}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = FONT_HREF;
    document.head.appendChild(link);
  }, []);
}

function lines(value: string | null | undefined): string[] {
  return (value ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function Reveal({ as: Tag = 'section', className, children }: { as?: 'section' | 'div'; className: string; children: ReactNode }) {
  const ref = useReveal<HTMLElement>();
  return (
    <Tag ref={ref as never} className={`sl-reveal ${className}`}>
      {children}
    </Tag>
  );
}

function Photo({ url, fallback, className }: { url: string | null; fallback: string; className: string }) {
  return (
    <div className={className}>
      {url ? <img src={url} alt="" loading="lazy" /> : <span className="sl-initial">{fallback}</span>}
    </div>
  );
}

interface VenueProps {
  title: string;
  time: string | null;
  venue: string;
  address: string;
  mapsUrl: string | null;
  icon: ReactNode;
}

function Venue({ title, time, venue, address, mapsUrl, icon }: VenueProps) {
  const configured = { google_maps_url: mapsUrl, venue, address };
  const embed = mapsEmbedUrlFor(configured);
  const link = mapsUrlFor(configured);
  return (
    <div className="sl-venue">
      <div className="sl-venue-pic">
        {embed ? (
          <iframe
            title={`Map showing ${venue}`}
            src={embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        ) : (
          icon
        )}
      </div>
      <div className="sl-venue-body">
        <h3>{title}</h3>
        {time ? (
          <div className="sl-pill">
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {time}
          </div>
        ) : null}
        <p>
          <b>{venue}</b>
        </p>
        <p className="sl-muted">{address}</p>
        {link ? (
          <a className="sl-btn" href={link} target="_blank" rel="noopener noreferrer">
            <MapPin aria-hidden="true" className="h-4 w-4" />
            View on map
          </a>
        ) : null}
      </div>
    </div>
  );
}

interface StarlightInvitationProps {
  event: EventSettings;
  hero: HeroSettings | null;
  invitation: InvitationSettings | null;
}

export function StarlightInvitation({ event, hero, invitation }: StarlightInvitationProps) {
  useStarlightFonts();

  const inv = invitation;
  const name = event.celebrant_name;
  const initial = name.trim().charAt(0).toUpperCase() || '♥︎';
  const occasion = hero?.title ?? 'You are invited';

  const [envelopeOpen, setEnvelopeOpen] = useState(!(inv?.envelope_enabled ?? true));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const songUrl = safeExternalUrl(inv?.song_url);

  function playSong() {
    const audio = audioRef.current;
    if (!audio || !songUrl) return;
    audio.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }

  function toggleSong() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) playSong();
    else {
      audio.pause();
      setIsPlaying(false);
    }
  }

  const eventDate = parseDateOnly(event.event_date);
  const countdown = useCountdown(toLocalDateTime(event.event_date, inv?.ceremony_time ?? event.start_time));
  const startsAt = formatTime(inv?.ceremony_time ?? event.start_time);

  const rsvpUrl = safeExternalUrl(event.rsvp_url);
  const ninong = lines(inv?.ninong);
  const ninang = lines(inv?.ninang);
  const reminders = lines(inv?.reminders);
  const blockColors = ['#e8315a', '#ff7aa0', '#b3123f', '#f25c84'];
  const blocks = name.replace(/\s+/g, '').toUpperCase().slice(0, 6).split('');
  const shortDate = eventDate
    ? [eventDate.getMonth() + 1, eventDate.getDate(), eventDate.getFullYear() % 100]
        .map((part) => String(part).padStart(2, '0'))
        .join(' · ')
    : null;

  return (
    <div className="sl">
      {!envelopeOpen ? (
        <Envelope
          celebrantName={name}
          occasion={occasion}
          heading={inv?.envelope_heading ?? 'A berry sweet letter'}
          onOpenStart={playSong}
          onOpened={() => setEnvelopeOpen(true)}
        />
      ) : null}

      {songUrl ? (
        <audio
          ref={audioRef}
          src={songUrl}
          loop
          preload="none"
          onTimeUpdate={(e) => {
            const audio = e.currentTarget;
            setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
          }}
          onPause={() => setIsPlaying(false)}
          onPlay={() => setIsPlaying(true)}
        />
      ) : null}

      <header className="sl-hero">
        <StarField count={45} />
        <div className="sl-rel">
          <p className="sl-kicker">{hero?.label ?? 'Please join us to celebrate'}</p>
          <p className="sl-hello sl-hand">our sweetest berry</p>
          <h1 className="sl-name sl-display">{name}</h1>
          <p className="sl-occasion">{occasion}</p>
          <div className="sl-ring">
            <Photo url={hero?.image_url ?? null} fallback={initial} className="sl-ring-in" />
          </div>
          {inv?.hero_tagline ?? hero?.subtitle ? (
            <p className="sl-tagline">{inv?.hero_tagline ?? hero?.subtitle}</p>
          ) : null}
        </div>
        <svg className="sl-clouds" viewBox="0 0 600 120" preserveAspectRatio="none" aria-hidden="true">
          <path
            fill="#fff0f5"
            d="M0 70 Q40 30 90 55 Q120 10 180 40 Q230 5 280 45 Q330 15 380 50 Q430 20 480 48 Q530 25 570 55 Q600 45 620 60 L620 120 L0 120Z"
          />
        </svg>
      </header>

      <div className="sl-body">
        <div className="sl-main">
          {eventDate ? (
            <Reveal as="div" className="sl-ticket">
              <div>
                <small>{eventDate.toLocaleDateString('en-US', { weekday: 'long' })}</small>
                <div className="val">{eventDate.toLocaleDateString('en-US', { month: 'long' })}</div>
              </div>
              <div className="mid">
                <div className="big">{eventDate.getDate()}</div>
                <small>{eventDate.getFullYear()}</small>
              </div>
              <div>
                <small>starts at</small>
                <div className="val">{startsAt ?? 'TBA'}</div>
              </div>
            </Reveal>
          ) : null}

          {songUrl ? (
            <div className="sl-bubble sl-dark sl-player" data-playing={isPlaying}>
              <div className="sl-disc" aria-hidden="true" />
              <div className="t">
                <b>{inv?.song_title ?? 'Our song'}</b>
                {inv?.song_subtitle ? <small style={{ opacity: 0.8 }}>{inv.song_subtitle}</small> : null}
                <div className="sl-bar" aria-hidden="true">
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
              <button
                type="button"
                className="sl-pbtn"
                onClick={toggleSong}
                aria-label={isPlaying ? 'Pause music' : 'Play music'}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </button>
            </div>
          ) : null}

          {hero?.show_countdown !== false && countdown.isReady ? (
            <Reveal className="sl-bubble sl-dark">
              <StarField count={25} />
              <div className="sl-rel">
                <p className="sl-kicker">The countdown</p>
                <h2 className="sl-section-title" style={{ fontSize: 26, marginTop: 10 }}>
                  {countdown.isPast ? 'Thank you for celebrating with us!' : (inv?.countdown_title ?? 'The big day is almost here!')}
                </h2>
                {inv?.countdown_text ? <p style={{ opacity: 0.85, margin: 0 }}>{inv.countdown_text}</p> : null}
                {!countdown.isPast ? (
                  <div
                    className="sl-count"
                    role="timer"
                    aria-label={`${countdown.days} days, ${countdown.hours} hours and ${countdown.minutes} minutes to go`}
                  >
                    {(
                      [
                        [countdown.days, 'days'],
                        [countdown.hours, 'hours'],
                        [countdown.minutes, 'mins'],
                        [countdown.seconds, 'secs'],
                      ] as const
                    ).map(([value, label]) => (
                      <div key={label} aria-hidden="true">
                        <b>{value}</b>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                {inv?.countdown_image_url ? (
                  <Photo url={inv.countdown_image_url} fallback={initial} className="sl-frame" />
                ) : null}
              </div>
            </Reveal>
          ) : null}

          {inv?.banner_text ? (
            <Reveal as="div" className="sl-bubble sl-banner">
              {inv.banner_text}
            </Reveal>
          ) : null}

          <Reveal className="sl-bubble">
            <p className="sl-kicker sl-muted">{name}</p>
            <h2 className="sl-section-title">
              <em>The</em>Location
            </h2>
            {inv?.ceremony_venue ? (
              <Venue
                title={inv.ceremony_title ?? 'Ceremony'}
                time={formatTime(inv.ceremony_time)}
                venue={inv.ceremony_venue}
                address={inv.ceremony_address ?? ''}
                mapsUrl={inv.ceremony_maps_url}
                icon={<Church aria-hidden="true" className="h-14 w-14" />}
              />
            ) : null}
            <Venue
              title={inv?.reception_title ?? 'Reception'}
              time={formatTime(event.start_time)}
              venue={event.venue}
              address={event.address}
              mapsUrl={event.google_maps_url}
              icon={<PartyPopper aria-hidden="true" className="h-14 w-14" />}
            />
            {inv?.fun_title || inv?.fun_text ? (
              <div className="sl-detail" style={{ marginTop: 20 }}>
                <h4>
                  <Sparkles aria-hidden="true" className="h-6 w-6" />
                  {inv.fun_title ?? 'A little extra fun'}
                </h4>
                {inv.fun_text ? <p>{inv.fun_text}</p> : null}
              </div>
            ) : null}
          </Reveal>

          {ninong.length || ninang.length ? (
            <Reveal className="sl-bubble">
              <p className="sl-kicker sl-muted">with gratitude to our</p>
              <h2 className="sl-section-title">
                <em>God</em>parents
              </h2>
              <div className="sl-gp">
                {ninong.length ? (
                  <div>
                    <h3>NINONG</h3>
                    <ul>
                      {ninong.map((person) => (
                        <li key={person}>{person}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {ninang.length ? (
                  <div>
                    <h3>NINANG</h3>
                    <ul>
                      {ninang.map((person) => (
                        <li key={person}>{person}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Reveal>
          ) : null}

          <Reveal className="sl-bubble">
            <p className="sl-kicker sl-muted">{name}</p>
            <h2 className="sl-section-title">
              <em>The</em>Details
            </h2>
            <div className="sl-detail">
              <h4>
                <Shirt aria-hidden="true" className="h-6 w-6" />
                Dress Code
              </h4>
              <p>{event.dress_code ?? 'Come as you are'}</p>
            </div>
            {inv?.gift_guide ? (
              <div className="sl-detail">
                <h4>
                  <Gift aria-hidden="true" className="h-6 w-6" />
                  Gift Guide
                </h4>
                <p>{inv.gift_guide}</p>
              </div>
            ) : null}
            {reminders.length ? (
              <div className="sl-detail">
                <h4>
                  <Bell aria-hidden="true" className="h-6 w-6" />
                  Friendly Reminders
                </h4>
                <div className="sl-rem">
                  {reminders.map((item) => (
                    <div key={item}>
                      <CircleCheck aria-hidden="true" className="h-4 w-4" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {event.additional_info ? (
              <div className="sl-detail">
                <h4>
                  <Info aria-hidden="true" className="h-6 w-6" />
                  Good to know
                </h4>
                <p>{event.additional_info}</p>
              </div>
            ) : null}
            <div className="sl-detail">
              <h4>
                <Heart aria-hidden="true" className="h-6 w-6" />
                Thank you!
              </h4>
              <p>{event.birthday_message ?? `We're so grateful to have you in ${name}'s little world.`}</p>
            </div>
          </Reveal>

          {inv?.photo_image_url ? (
            <Reveal as="div" className="sl-frame">
              <img src={inv.photo_image_url} alt="" loading="lazy" />
            </Reveal>
          ) : null}

          <Reveal className="sl-bubble sl-dark" >
            <StarField count={20} />
            <div className="sl-rel">
              <p className="sl-kicker">{name}</p>
              <h2 className="sl-rsvp-title">RSVP</h2>
              {event.rsvp_note ? <p style={{ opacity: 0.85, margin: '10px 0 0' }}>{event.rsvp_note}</p> : null}
              {event.rsvp_deadline ? (
                <p className="sl-kicker" style={{ marginTop: 12, color: 'var(--sl-gold)' }}>
                  Reply by {formatLongDate(event.rsvp_deadline)}
                </p>
              ) : null}

              {event.rsvp_method === 'google_form' ? (
                rsvpUrl ? (
                  <div className="sl-rsvp-actions">
                    <div className="sl-qr">
                      <QRCodeSVG value={rsvpUrl} level="M" marginSize={0} aria-label="QR code linking to the RSVP form" />
                      <small>Scan me</small>
                    </div>
                    <div>
                      <p>Scan the QR code or tap the button to fill out our RSVP form.</p>
                      <a className="sl-send" href={rsvpUrl} target="_blank" rel="noopener noreferrer">
                        Fill out the RSVP form
                        <ExternalLink aria-hidden="true" className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p style={{ marginTop: 20, opacity: 0.75, fontStyle: 'italic' }}>
                    The RSVP form will be available soon.
                  </p>
                )
              ) : (
                <div className="sl-rsvp-actions single">
                  <Link className="sl-send" to="/rsvp">
                    Send your reply
                  </Link>
                </div>
              )}
            </div>
          </Reveal>

          {eventDate ? (
            <Reveal className="sl-bubble sl-std">
              <p className="sl-kicker sl-muted">{name}</p>
              <p className="sl-kicker sl-muted" style={{ marginTop: 4 }}>
                {inv?.save_date_text ?? occasion}
              </p>
              <p className="word">SAVE</p>
              <div className="the">the</div>
              <p className="word">DATE</p>
              {shortDate ? <div className="d">{shortDate}</div> : null}
              <div className="sl-blocks" aria-hidden="true">
                {blocks.map((letter, index) => (
                  <span
                    key={`${letter}-${index}`}
                    style={{ background: blockColors[index % blockColors.length], transform: `rotate(${index % 2 ? 6 : -6}deg)` }}
                  >
                    {letter}
                  </span>
                ))}
              </div>
            </Reveal>
          ) : null}

          {inv?.closing_letter || inv?.closing_image_url ? (
            <Reveal className="sl-bubble">
              {inv.closing_image_url ? (
                <div className="sl-ring" style={{ marginTop: 0, width: 'min(220px, 60vw)' }}>
                  <Photo url={inv.closing_image_url} fallback={initial} className="sl-ring-in" />
                </div>
              ) : null}
              {inv.closing_letter ? <p className="sl-closing-letter">{inv.closing_letter}</p> : null}
              <div className="sl-sig">{inv.closing_signature ?? name}</div>
            </Reveal>
          ) : null}
        </div>
      </div>
    </div>
  );
}
