import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { User, Edit } from "lucide-react";
import type { UserWithStats } from "@shared/schema";

interface UserProfileProps {
  user: UserWithStats;
}

export default function UserProfile({ user }: UserProfileProps) {
  const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  const displayName = fullName || user.email || 'Usuário';

  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center">
          <img 
            src={user.profileImageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4A90E2&color=fff`} 
            alt="Profile picture" 
            className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
          />
          <h3 className="font-semibold text-lg text-deep-blue-gray mb-1">
            {displayName}
          </h3>
          {user.denomination && (
            <Badge variant="secondary" className="mb-4">
              {user.denomination}
            </Badge>
          )}
          
          {user.favoriteVerse && (
            <div className="bg-gradient-to-r from-spiritual-blue to-blue-600 rounded-lg p-4 mb-4">
              <p className="text-white text-sm font-medium mb-2">Versículo Favorito</p>
              <p className="text-white text-xs font-scripture italic">
                "{user.favoriteVerse}"
              </p>
            </div>
          )}
          
          <div className="flex justify-around text-center mb-4">
            <div>
              <p className="font-semibold text-spiritual-blue">
                {user._count?.followers || 0}
              </p>
              <p className="text-xs text-gray-600">Seguidores</p>
            </div>
            <div>
              <p className="font-semibold text-spiritual-blue">
                {user._count?.following || 0}
              </p>
              <p className="text-xs text-gray-600">Seguindo</p>
            </div>
            <div>
              <p className="font-semibold text-spiritual-blue">
                {user._count?.posts || 0}
              </p>
              <p className="text-xs text-gray-600">Posts</p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="w-full">
            <Edit className="w-4 h-4 mr-2" />
            Editar Perfil
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
