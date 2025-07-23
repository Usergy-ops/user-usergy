import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, DollarSign, Clock, Users, Star, Heart, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

interface PublicProject {
  id: number;
  title: string;
  description: string;
  client: string;
  reward: number;
  estimatedTime: string;
  deadline: Date;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  spotsAvailable: number;
  totalSpots: number;
  requirements: string[];
  location: string;
  clientRating: number;
  projectRating: number;
  applicants: number;
  featured: boolean;
  remote: boolean;
  collaboration: boolean;
}

export const BrowseProjectsTab: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [rewardRange, setRewardRange] = useState([0, 1000]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [collaborationOnly, setCollaborationOnly] = useState(false);
  const [sortBy, setSortBy] = useState('newest');

  // Mock public projects data
  const publicProjects: PublicProject[] = [
    {
      id: 1,
      title: 'Revolutionary Social Media App Testing',
      description: 'Help us test and improve the next generation of social media platforms. We\'re looking for users who understand social dynamics and can provide meaningful feedback.',
      client: 'SocialTech Inc.',
      reward: 380,
      estimatedTime: '4-6 hours',
      deadline: new Date('2024-02-28'),
      category: 'social',
      difficulty: 'Medium',
      tags: ['Social Media', 'Mobile', 'UX Testing', 'Community'],
      spotsAvailable: 3,
      totalSpots: 8,
      requirements: ['Social Media Experience', 'Mobile Testing', 'Community Management'],
      location: 'Remote',
      clientRating: 4.8,
      projectRating: 4.6,
      applicants: 15,
      featured: true,
      remote: true,
      collaboration: true
    },
    {
      id: 2,
      title: 'AI-Powered Learning Platform Validation',
      description: 'Join our mission to revolutionize education with AI. We need experienced educators and learners to test our adaptive learning system.',
      client: 'EduTech Solutions',
      reward: 450,
      estimatedTime: '5-7 hours',
      deadline: new Date('2024-03-05'),
      category: 'education',
      difficulty: 'Hard',
      tags: ['AI', 'Education', 'Learning', 'Technology'],
      spotsAvailable: 2,
      totalSpots: 5,
      requirements: ['Education Background', 'AI Knowledge', 'User Testing'],
      location: 'New York, NY',
      clientRating: 4.9,
      projectRating: 4.8,
      applicants: 23,
      featured: true,
      remote: false,
      collaboration: true
    },
    {
      id: 3,
      title: 'Sustainable E-commerce Platform Review',
      description: 'Help us create the most sustainable e-commerce platform. We\'re looking for environmentally conscious consumers to test our green shopping experience.',
      client: 'GreenCommerce Co.',
      reward: 290,
      estimatedTime: '3-4 hours',
      deadline: new Date('2024-02-22'),
      category: 'ecommerce',
      difficulty: 'Easy',
      tags: ['E-commerce', 'Sustainability', 'Green Tech', 'Shopping'],
      spotsAvailable: 6,
      totalSpots: 10,
      requirements: ['E-commerce Experience', 'Sustainability Interest', 'User Testing'],
      location: 'Remote',
      clientRating: 4.7,
      projectRating: 4.5,
      applicants: 8,
      featured: false,
      remote: true,
      collaboration: false
    },
    {
      id: 4,
      title: 'Smart Home Security System Testing',
      description: 'Test cutting-edge smart home security features. We need users familiar with home automation to validate our latest security innovations.',
      client: 'SecureHome Tech',
      reward: 520,
      estimatedTime: '6-8 hours',
      deadline: new Date('2024-03-10'),
      category: 'iot',
      difficulty: 'Hard',
      tags: ['IoT', 'Security', 'Smart Home', 'Technology'],
      spotsAvailable: 1,
      totalSpots: 4,
      requirements: ['IoT Experience', 'Security Knowledge', 'Smart Home Setup'],
      location: 'San Francisco, CA',
      clientRating: 4.9,
      projectRating: 4.7,
      applicants: 31,
      featured: true,
      remote: false,
      collaboration: true
    }
  ];

  const filteredProjects = useMemo(() => {
    let filtered = publicProjects;

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        project.client.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(project => project.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(project => project.difficulty === difficultyFilter);
    }

    // Reward range filter
    filtered = filtered.filter(project => 
      project.reward >= rewardRange[0] && project.reward <= rewardRange[1]
    );

    // Remote filter
    if (remoteOnly) {
      filtered = filtered.filter(project => project.remote);
    }

    // Collaboration filter
    if (collaborationOnly) {
      filtered = filtered.filter(project => project.collaboration);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return b.id - a.id;
        case 'reward':
          return b.reward - a.reward;
        case 'deadline':
          return a.deadline.getTime() - b.deadline.getTime();
        case 'popularity':
          return b.applicants - a.applicants;
        case 'rating':
          return b.projectRating - a.projectRating;
        default:
          return 0;
      }
    });

    return filtered;
  }, [searchQuery, categoryFilter, difficultyFilter, rewardRange, remoteOnly, collaborationOnly, sortBy]);

  const handleApply = (projectId: number) => {
    toast({
      title: 'Application Submitted!',
      description: 'Your application has been sent to the project team. You\'ll hear back within 24 hours.',
    });
  };

  const handleSaveProject = (projectId: number) => {
    toast({
      title: 'Project Saved!',
      description: 'The project has been added to your saved projects list.',
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Projects</h2>
          <p className="text-gray-600">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} available • 
            {filteredProjects.filter(p => p.featured).length} featured
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="reward">Highest Reward</SelectItem>
              <SelectItem value="deadline">Deadline</SelectItem>
              <SelectItem value="popularity">Most Popular</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="ecommerce">E-commerce</SelectItem>
                    <SelectItem value="iot">IoT & Smart Home</SelectItem>
                    <SelectItem value="ai">AI & Machine Learning</SelectItem>
                    <SelectItem value="fintech">Fintech</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Easy">Easy</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Reward Range */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Reward Range (${rewardRange[0]} - ${rewardRange[1]})
                </label>
                <Slider
                  value={rewardRange}
                  onValueChange={setRewardRange}
                  max={1000}
                  min={0}
                  step={50}
                  className="w-full"
                />
              </div>

              {/* Preferences */}
              <div className="space-y-3">
                <label className="text-sm font-medium">Preferences</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remote"
                      checked={remoteOnly}
                      onCheckedChange={(checked) => setRemoteOnly(checked === true)}
                    />
                    <label htmlFor="remote" className="text-sm">Remote Only</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="collaboration"
                      checked={collaborationOnly}
                      onCheckedChange={(checked) => setCollaborationOnly(checked === true)}
                    />
                    <label htmlFor="collaboration" className="text-sm">Team Collaboration</label>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        <div className="lg:col-span-3">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">Try adjusting your filters or search terms</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {project.featured && (
                            <Badge className="bg-purple-100 text-purple-800">
                              Featured
                            </Badge>
                          )}
                          <Badge className={getDifficultyColor(project.difficulty)}>
                            {project.difficulty}
                          </Badge>
                          {project.remote && (
                            <Badge variant="outline">Remote</Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg hover:text-blue-600 transition-colors">
                          {project.title}
                        </CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">${project.reward}</div>
                        <div className="text-sm text-gray-500">{project.estimatedTime}</div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Client Info */}
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={`https://ui-avatars.com/api/?name=${project.client}&background=random`} />
                        <AvatarFallback>{project.client.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{project.client}</div>
                        <div className="flex items-center space-x-1 text-sm text-gray-500">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`w-3 h-3 ${i < Math.floor(project.clientRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              >
                                ★
                              </div>
                            ))}
                          </div>
                          <span>{project.clientRating}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm line-clamp-3">{project.description}</p>
                    
                    {/* Tags */}
                    <div className="flex flex-wrap gap-2">
                      {project.tags.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {project.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{project.tags.length - 3} more
                        </Badge>
                      )}
                    </div>
                    
                    {/* Project Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-1 text-gray-600">
                        <MapPin className="w-4 h-4" />
                        <span>{project.location}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Users className="w-4 h-4" />
                        <span>{project.spotsAvailable}/{project.totalSpots} spots</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>Due {formatDistanceToNow(project.deadline, { addSuffix: true })}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-600">
                        <BookOpen className="w-4 h-4" />
                        <span>{project.applicants} applicants</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center space-x-3 pt-4">
                      <Button 
                        onClick={() => handleApply(project.id)}
                        className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                      >
                        Apply Now
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleSaveProject(project.id)}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
