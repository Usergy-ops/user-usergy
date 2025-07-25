import React, { useState } from 'react';
import { Heart, MessageCircle, Share, Users, TrendingUp, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface SocialViewProps {
  project: any;
}

const ActivityCard: React.FC<{ activity: any }> = ({ activity }) => {
  const [liked, setLiked] = useState(false);

  return (
    <Card className="transition-all duration-300 hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={activity.user.avatar} />
            <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-foreground">{activity.user.name}</span>
              <Badge variant="outline" className="text-xs">{activity.user.role}</Badge>
              <span className="text-xs text-muted-foreground">{activity.timestamp}</span>
            </div>
            
            <p className="text-sm text-foreground mb-3">{activity.content}</p>
            
            {activity.image && (
              <div className="mb-3 rounded-lg overflow-hidden">
                <img 
                  src={activity.image} 
                  alt="Activity" 
                  className="w-full h-32 object-cover"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-4 text-sm">
              <button
                onClick={() => setLiked(!liked)}
                className={`flex items-center space-x-1 transition-colors ${
                  liked ? 'text-red-500' : 'text-muted-foreground hover:text-red-500'
                }`}
              >
                <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
                <span>{activity.likes + (liked ? 1 : 0)}</span>
              </button>
              
              <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
                <MessageCircle className="w-4 h-4" />
                <span>{activity.comments}</span>
              </button>
              
              <button className="flex items-center space-x-1 text-muted-foreground hover:text-foreground transition-colors">
                <Share className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LeaderboardCard: React.FC<{ user: any; rank: number }> = ({ user, rank }) => {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🏆';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <div className="text-lg font-bold w-8">{getRankIcon(rank)}</div>
      <Avatar className="w-8 h-8">
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-semibold text-sm">{user.name}</div>
        <div className="text-xs text-muted-foreground">{user.points} points</div>
      </div>
      <Badge variant="outline" className="text-xs">
        {user.progress}%
      </Badge>
    </div>
  );
};

export const SocialView: React.FC<SocialViewProps> = ({ project }) => {
  const activities = [
    {
      id: '1',
      user: {
        name: 'Sarah Chen',
        avatar: '/placeholder.svg',
        role: 'Alpha Tester'
      },
      content: 'Just completed the initial evaluation! The AI response time is incredibly fast. Looking forward to diving deeper into the advanced features. 🚀',
      timestamp: '2 hours ago',
      likes: 12,
      comments: 3,
      image: null
    },
    {
      id: '2',
      user: {
        name: 'Marcus Johnson',
        avatar: '/placeholder.svg',
        role: 'Beta Tester'
      },
      content: 'Found an interesting edge case in the natural language processing module. The AI handles complex queries really well, but struggles with ambiguous pronouns. Documented everything in the issues section.',
      timestamp: '4 hours ago',
      likes: 8,
      comments: 5,
      image: null
    },
    {
      id: '3',
      user: {
        name: 'Emily Rodriguez',
        avatar: '/placeholder.svg',
        role: 'Alpha Tester'
      },
      content: 'Team collaboration feature is a game changer! Screenshot of the real-time sync in action.',
      timestamp: '6 hours ago',
      likes: 15,
      comments: 7,
      image: '/placeholder.svg'
    }
  ];

  const leaderboard = [
    { name: 'Alex Thompson', avatar: '/placeholder.svg', points: 2850, progress: 95 },
    { name: 'Sarah Chen', avatar: '/placeholder.svg', points: 2720, progress: 88 },
    { name: 'Marcus Johnson', avatar: '/placeholder.svg', points: 2650, progress: 85 },
    { name: 'Emily Rodriguez', avatar: '/placeholder.svg', points: 2400, progress: 82 },
    { name: 'David Kim', avatar: '/placeholder.svg', points: 2200, progress: 75 }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center md:text-left">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Community Hub
        </h1>
        <p className="text-muted-foreground">
          Connect with other testers, share insights, and see how you're progressing.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="w-5 h-5" />
                <span>Community Activity</span>
              </CardTitle>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>

          <Card className="bg-muted/30 border border-border/50">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground mb-4">
                Share your own insights and discoveries with the community!
              </p>
              <Button className="bg-gradient-to-r from-[#00C6FB] to-[#005BEA] text-white">
                Create Post
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Stats */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5" />
                <span>Project Stats</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Testers</span>
                <span className="font-semibold">47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Reports</span>
                <span className="font-semibold">156</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issues Found</span>
                <span className="font-semibold">23</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Avg. Progress</span>
                <span className="font-semibold">73%</span>
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card className="bg-card/80 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="w-5 h-5" />
                <span>Leaderboard</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {leaderboard.map((user, index) => (
                <LeaderboardCard key={user.name} user={user} rank={index + 1} />
              ))}
            </CardContent>
          </Card>

          {/* Your Achievements */}
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
            <CardHeader>
              <CardTitle className="text-primary">Your Achievements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🎯</span>
                <div>
                  <div className="font-semibold text-sm">First Task Complete</div>
                  <div className="text-xs text-muted-foreground">Completed your first testing task</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-2xl">🔍</span>
                <div>
                  <div className="font-semibold text-sm">Bug Hunter</div>
                  <div className="text-xs text-muted-foreground">Reported 5 critical issues</div>
                </div>
              </div>
              <div className="flex items-center space-x-2 opacity-50">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="font-semibold text-sm">Power Tester</div>
                  <div className="text-xs text-muted-foreground">Complete 20 tasks (15/20)</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};