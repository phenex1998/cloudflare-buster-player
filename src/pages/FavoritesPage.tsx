import React from 'react';
import { useIptv } from '@/contexts/IptvContext';
import AppHeader from '@/components/AppHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, Tv, Film, MonitorPlay, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

const FavoritesPage: React.FC = () => {
  const { favorites, toggleFavorite, history } = useIptv();
  const navigate = useNavigate();

  const liveFavs = favorites.filter(f => f.type === 'live');
  const vodFavs = favorites.filter(f => f.type === 'vod');
  const seriesFavs = favorites.filter(f => f.type === 'series');

  const FavItem = ({ item }: { item: typeof favorites[0] }) => (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
      {item.icon ? (
        <img src={item.icon} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
          {item.type === 'live' ? <Tv className="w-4 h-4 text-muted-foreground" /> :
           item.type === 'vod' ? <Film className="w-4 h-4 text-muted-foreground" /> :
           <MonitorPlay className="w-4 h-4 text-muted-foreground" />}
        </div>
      )}
      <span className="flex-1 text-sm font-medium text-foreground truncate">{item.name}</span>
      <button
        onClick={() => toggleFavorite(item)}
        className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <AppHeader title="Favoritos" showSearch={false} />

      <Tabs defaultValue="favorites" className="px-4 pt-3">
        <TabsList className="w-full">
          <TabsTrigger value="favorites" className="flex-1">
            <Heart className="w-4 h-4 mr-1.5" /> Favoritos
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1">
            <Clock className="w-4 h-4 mr-1.5" /> Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="favorites" className="mt-4 space-y-4">
          {favorites.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">Nenhum favorito ainda</p>
          ) : (
            <>
              {liveFavs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">TV ao Vivo</h3>
                  {liveFavs.map(f => <FavItem key={`${f.type}-${f.id}`} item={f} />)}
                </div>
              )}
              {vodFavs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Filmes</h3>
                  {vodFavs.map(f => <FavItem key={`${f.type}-${f.id}`} item={f} />)}
                </div>
              )}
              {seriesFavs.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Séries</h3>
                  {seriesFavs.map(f => <FavItem key={`${f.type}-${f.id}`} item={f} />)}
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-10">Nenhum histórico</p>
          ) : (
            <div className="space-y-1">
              {history.map((h, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
                  {h.icon ? (
                    <img src={h.icon} alt="" className="w-10 h-10 rounded-lg object-cover bg-muted" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{h.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(h.timestamp).toLocaleString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FavoritesPage;
