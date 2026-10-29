// Avatar pack catalog: guides, skin tones, hairstyles and outfits (source: avatar-studio/catalog.json).
// Skin tone and guide are never locked; only hairstyles and outfits can be.

export type UnlockRule = string; // "start" = free from the first launch

export interface AvatarItem { id: number; label: string; rule: UnlockRule; text: string }
export interface AvatarGuide { id: string; name: string; hairstyles: AvatarItem[] }
export interface AvatarTone { id: number; label: string; hex: string }

export const AVATAR_TONES: AvatarTone[] = [
  {
    "id": 1,
    "label": "Light",
    "hex": "#EDC0A3"
  },
  {
    "id": 2,
    "label": "Tan",
    "hex": "#D8A077"
  },
  {
    "id": 3,
    "label": "Brown",
    "hex": "#B27D58"
  },
  {
    "id": 4,
    "label": "Deep",
    "hex": "#7C503A"
  }
];

export const AVATAR_OUTFITS: AvatarItem[] = [
  {
    "id": 1,
    "label": "Cream knit sweater",
    "rule": "start",
    "text": "Available from the first launch (free)"
  },
  {
    "id": 2,
    "label": "Sage cardigan",
    "rule": "start",
    "text": "Available from the first launch (free)"
  },
  {
    "id": 3,
    "label": "Lilac blouse",
    "rule": "start",
    "text": "Available from the first launch (free)"
  },
  {
    "id": 4,
    "label": "Chambray shirt",
    "rule": "start",
    "text": "Available from the first launch (free)"
  },
  {
    "id": 5,
    "label": "Dusty-rose knit top",
    "rule": "start",
    "text": "Available from the first launch (free)"
  },
  {
    "id": 6,
    "label": "Teal wrap blouse",
    "rule": "vitals-streak-7",
    "text": "Log vital signs 7 days in a row"
  },
  {
    "id": 7,
    "label": "Mustard cardigan",
    "rule": "journal-5",
    "text": "Write 5 journal entries"
  },
  {
    "id": 8,
    "label": "Ivory blazer",
    "rule": "checkin-14",
    "text": "Complete 14 daily check-ins"
  },
  {
    "id": 9,
    "label": "Floral blouse",
    "rule": "vitals-streak-30",
    "text": "Log vital signs 30 days in a row"
  },
  {
    "id": 10,
    "label": "Charcoal turtleneck",
    "rule": "journal-20",
    "text": "Write 20 journal entries"
  }
];

export const AVATAR_GUIDES: AvatarGuide[] = [
  {
    "id": "sofia",
    "name": "Sofia",
    "hairstyles": [
      {
        "id": 1,
        "label": "Low bun",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 2,
        "label": "Loose waves",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 3,
        "label": "High ponytail",
        "rule": "vitals-streak-3",
        "text": "Log vital signs 3 days in a row"
      },
      {
        "id": 4,
        "label": "Half-up curls",
        "rule": "checkin-14",
        "text": "Complete 14 daily check-ins"
      }
    ]
  },
  {
    "id": "amara",
    "name": "Amara",
    "hairstyles": [
      {
        "id": 1,
        "label": "Short natural curls",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 2,
        "label": "Twist-out",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 3,
        "label": "Braids low bun",
        "rule": "vitals-streak-3",
        "text": "Log vital signs 3 days in a row"
      },
      {
        "id": 4,
        "label": "High puff",
        "rule": "checkin-14",
        "text": "Complete 14 daily check-ins"
      }
    ]
  },
  {
    "id": "claire",
    "name": "Claire",
    "hairstyles": [
      {
        "id": 1,
        "label": "Straight, bob length",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 2,
        "label": "Shoulder waves",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 3,
        "label": "Low bun",
        "rule": "vitals-streak-3",
        "text": "Log vital signs 3 days in a row"
      },
      {
        "id": 4,
        "label": "High ponytail",
        "rule": "checkin-14",
        "text": "Complete 14 daily check-ins"
      }
    ]
  },
  {
    "id": "elena",
    "name": "Elena",
    "hairstyles": [
      {
        "id": 1,
        "label": "Long waves",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 2,
        "label": "Straight, side part",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 3,
        "label": "High bun",
        "rule": "vitals-streak-3",
        "text": "Log vital signs 3 days in a row"
      },
      {
        "id": 4,
        "label": "Low braid",
        "rule": "checkin-14",
        "text": "Complete 14 daily check-ins"
      }
    ]
  },
  {
    "id": "mei",
    "name": "Mei",
    "hairstyles": [
      {
        "id": 1,
        "label": "Bob",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 2,
        "label": "Long straight",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 3,
        "label": "Low ponytail",
        "rule": "vitals-streak-3",
        "text": "Log vital signs 3 days in a row"
      },
      {
        "id": 4,
        "label": "Wavy lob",
        "rule": "checkin-14",
        "text": "Complete 14 daily check-ins"
      }
    ]
  },
  {
    "id": "marian",
    "name": "Marianne",
    "hairstyles": [
      {
        "id": 1,
        "label": "Gray low ponytail",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 2,
        "label": "Short gray crop",
        "rule": "start",
        "text": "Available from the first launch (free)"
      },
      {
        "id": 3,
        "label": "Gray waves",
        "rule": "vitals-streak-7",
        "text": "Log vital signs 7 days in a row"
      },
      {
        "id": 4,
        "label": "Gray low bun",
        "rule": "checkin-14",
        "text": "Complete 14 daily check-ins"
      }
    ]
  }
];
