export function generateSampleNestedData(count: number = 10) {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    data.push({
      id: i + 1,
      name: `Item ${i + 1}`,
      description: `This is a description for item ${i + 1}`,
      price: Math.round(Math.random() * 1000) / 100,
      isActive: Math.random() > 0.5,
      tags: ['tag1', 'tag2', 'tag3'].slice(0, Math.floor(Math.random() * 3) + 1),
      metadata: {
        createdAt: new Date(Date.now() - Math.random() * 10000000000).toISOString(),
        updatedAt: new Date().toISOString(),
        version: Math.floor(Math.random() * 10) + 1,
        author: {
          name: `Author ${i + 1}`,
          email: `author${i + 1}@example.com`,
          role: ['admin', 'user', 'moderator'][Math.floor(Math.random() * 3)]
        },
        settings: {
          theme: ['light', 'dark', 'auto'][Math.floor(Math.random() * 3)],
          notifications: Math.random() > 0.5,
          language: ['en', 'es', 'fr'][Math.floor(Math.random() * 3)]
        }
      },
      categories: [
        {
          id: 1,
          name: 'Technology',
          subcategories: ['Programming', 'Hardware', 'Software']
        },
        {
          id: 2,
          name: 'Design',
          subcategories: ['UI/UX', 'Graphic Design', 'Web Design']
        }
      ].slice(0, Math.floor(Math.random() * 2) + 1),
      ratings: Array.from({ length: Math.floor(Math.random() * 5) + 1 }, (_, j) => ({
        userId: j + 1,
        score: Math.floor(Math.random() * 5) + 1,
        comment: `Comment ${j + 1} for item ${i + 1}`
      })),
      location: {
        address: {
          street: `${Math.floor(Math.random() * 9999)} Main St`,
          city: ['New York', 'Los Angeles', 'Chicago', 'Houston'][Math.floor(Math.random() * 4)],
          state: ['NY', 'CA', 'IL', 'TX'][Math.floor(Math.random() * 4)],
          zipCode: Math.floor(Math.random() * 90000) + 10000
        },
        coordinates: {
          latitude: (Math.random() - 0.5) * 180,
          longitude: (Math.random() - 0.5) * 360
        }
      }
    });
  }
  
  return data;
}

export function generateSimpleNestedData() {
  return [
    {
      id: 1,
      name: "Simple Object",
      details: {
        age: 25,
        city: "New York",
        hobbies: ["reading", "gaming", "cooking"]
      }
    },
    {
      id: 2,
      name: "Complex Object",
      profile: {
        personal: {
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com"
        },
        preferences: {
          theme: "dark",
          language: "en"
        }
      },
      scores: [85, 92, 78, 96]
    }
  ];
} 