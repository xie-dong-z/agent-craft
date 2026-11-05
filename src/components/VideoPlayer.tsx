import React, { useState } from 'react';

interface VideoPlayerProps {
  url: string;
  fallbackCover: string;
  title: string;
}

/**
 * Robust media embed parser supporting YouTube, Bilibili, and native HTML5 video
 */
export const VideoPlayer: React.FC<VideoPlayerProps> = ({ url, fallbackCover, title }) => {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <img
        src={fallbackCover}
        alt={title}
        className="aspect-video w-full object-cover rounded-[3px]"
      />
    );
  }

  const trimmed = url.trim();

  // YouTube match: watch?v=ID or youtu.be/ID or embed/ID
  const ytMatch = trimmed.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/i
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return (
      <iframe
        title={title}
        src={`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`}
        className="aspect-video w-full rounded-[3px] border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  // Bilibili match: /video/BV...
  const bvidMatch = trimmed.match(/bilibili\.com\/video\/(BV[0-9a-zA-Z]+)/i);
  if (bvidMatch && bvidMatch[1]) {
    const bvid = bvidMatch[1];
    return (
      <iframe
        title={title}
        src={`//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&as_wide=1`}
        className="aspect-video w-full rounded-[3px] border-0"
        allow="fullscreen"
        allowFullScreen
      />
    );
  }

  // Native HTML5 Video for direct MP4 / WebM / blob URLs
  return (
    <video
      src={trimmed}
      poster={fallbackCover}
      controls
      playsInline
      preload="metadata"
      onError={() => setHasError(true)}
      className="aspect-video w-full object-cover rounded-[3px]"
    >
      <track kind="captions" />
      Your browser does not support the video tag.
    </video>
  );
};
