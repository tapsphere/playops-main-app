import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ArrowLeft, Building2, Upload, User } from 'lucide-react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { useUser } from '@/contexts/UserContext';
import { DesignPaletteEditor } from '@/components/platform/DesignPaletteEditor';

export default function CreatorProfileEdit() {

  const { profileId } = useParams<{ profileId: string }>();

  const navigate = useNavigate();

  const location = useLocation();

  const { refetchProfile } = useUser();

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [fullName, setFullName] = useState('');

  const [bio, setBio] = useState('');

  const [avatarUrl, setAvatarUrl] = useState('');

  const [companyName, setCompanyName] = useState('');

  const [companyDescription, setCompanyDescription] = useState('');

  const [companyLogoUrl, setCompanyLogoUrl] = useState('');

  const [userId, setUserId] = useState<string | null>(null);

  const [userRole, setUserRole] = useState<'brand' | 'creator' | null>(null);

  const [gameAvatarUrl, setGameAvatarUrl] = useState('');

  const [particleEffect, setParticleEffect] = useState('sparkles');

  const [mascotAnimationType, setMascotAnimationType] = useState<'static' | 'gif' | 'lottie' | 'sprite'>('static');

  const [primaryColor, setPrimaryColor] = useState('#0078D4');

  const [secondaryColor, setSecondaryColor] = useState('#50E6FF');

  const [designPalette, setDesignPalette] = useState({

    primary: '#C8DBDB',

    secondary: '#6C8FA4',

    accent: '#2D5556',

    background: '#F5EDD3',

    highlight: '#F0C7A0',

    text: '#2D5556',

    font: 'Inter, sans-serif'

  });

  

  // Image crop states

  const [cropDialogOpen, setCropDialogOpen] = useState(false);

  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });

  const [zoom, setZoom] = useState(1);

  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const [cropType, setCropType] = useState<'avatar' | 'logo' | 'game-avatar'>('avatar');



  useEffect(() => {

    loadProfile();

  }, [profileId]);



  const loadProfile = async () => {

    setLoading(true);

    try {

      let idToLoad = profileId;

      const { data: { user } } = await supabase.auth.getUser();



      if (!idToLoad) {

        if (!user) {

          navigate('/auth');

          return;

        }

        idToLoad = user.id;

      }

      

      setUserId(idToLoad);



      const isCreatorPath = location.pathname.includes('/creator');

      const detectedRole = isCreatorPath ? 'creator' : 'brand';

      setUserRole(detectedRole);



      const { data, error } = await supabase

        .from('profiles')

        .select('full_name, bio, avatar_url, company_name, company_description, company_logo_url, design_palette, game_avatar_url, default_particle_effect, mascot_animation_type, primary_color, secondary_color')

        .eq('user_id', idToLoad)

        .single();



      if (error && error.code !== 'PGRST116') {

        throw error;

      }



      if (data) {

        setFullName(data.full_name || '');

        setBio(data.bio || '');

        

        // Ensure avatar_url is an absolute URL

        let finalAvatarUrl = data.avatar_url || '';

        if (finalAvatarUrl && !finalAvatarUrl.startsWith('http')) {

          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(finalAvatarUrl);

          finalAvatarUrl = urlData.publicUrl;

        }

        setAvatarUrl(finalAvatarUrl);



        setCompanyName(data.company_name || '');

        setCompanyDescription(data.company_description || '');



        // Ensure company_logo_url is an absolute URL

        let finalLogoUrl = data.company_logo_url || '';

        if (finalLogoUrl && !finalLogoUrl.startsWith('http')) {

            const { data: urlData } = supabase.storage.from('logos').getPublicUrl(finalLogoUrl);

            finalLogoUrl = urlData.publicUrl;

        }

        setCompanyLogoUrl(finalLogoUrl);

        

        // Ensure game_avatar_url is an absolute URL

        let finalGameAvatarUrl = data.game_avatar_url || '';

        if (finalGameAvatarUrl && !finalGameAvatarUrl.startsWith('http')) {

            const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(finalGameAvatarUrl);

            finalGameAvatarUrl = urlData.publicUrl;

        }

        setGameAvatarUrl(finalGameAvatarUrl);

        

        setParticleEffect(data.default_particle_effect || 'sparkles');

        setPrimaryColor(data.primary_color || '#0078D4');

        setSecondaryColor(data.secondary_color || '#50E6FF');

        const animType = data.mascot_animation_type as 'static' | 'gif' | 'lottie' | 'sprite';

        setMascotAnimationType(animType || 'static');

        

        if (data.design_palette) {

          setDesignPalette(data.design_palette as any);

        }

      }

    } catch (error: any) {

      console.error('Failed to load profile:', error);

      toast.error(`Failed to load profile: ${error.message}`);

    } finally {

      setLoading(false);

    }

  };



  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {

    setCroppedAreaPixels(croppedAreaPixels);

  }, []);



  const createImage = (url: string): Promise<HTMLImageElement> =>

    new Promise((resolve, reject) => {

      const image = new Image();

      image.addEventListener('load', () => resolve(image));

      image.addEventListener('error', (error) => reject(error));

      image.src = url;

    });



  const getCroppedImg = async (imageSrc: string, pixelCrop: Area): Promise<Blob> => {

    const image = await createImage(imageSrc);

    const canvas = document.createElement('canvas');

    const ctx = canvas.getContext('2d');



    if (!ctx) throw new Error('No 2d context');



    canvas.width = pixelCrop.width;

    canvas.height = pixelCrop.height;



    // Clear canvas with transparency

    ctx.clearRect(0, 0, canvas.width, canvas.height);



    ctx.drawImage(

      image,

      pixelCrop.x,

      pixelCrop.y,

      pixelCrop.width,

      pixelCrop.height,

      0,

      0,

      pixelCrop.width,

      pixelCrop.height

    );



    return new Promise((resolve, reject) => {

      canvas.toBlob((blob) => {

        if (blob) resolve(blob);

        else reject(new Error('Canvas is empty'));

      }, 'image/png', 1.0);

    });

  };



  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'logo' | 'game-avatar') => {

    const file = e.target.files?.[0];

    if (file) {

      // Check if it's an animated file (GIF or Lottie JSON)

      const isAnimated = file.type === 'image/gif' || file.name.endsWith('.json');

      

      if (isAnimated) {

        // Skip crop for animated files, upload directly

        handleDirectUpload(file, type);

      } else {

        const reader = new FileReader();

        reader.onload = () => {

          setImageSrc(reader.result as string);

          setCropType(type);

          setCropDialogOpen(true);

          setCrop({ x: 0, y: 0 });

          setZoom(1);

        };

        reader.readAsDataURL(file);

      }

    }

  };



  const handleDirectUpload = async (file: File, type: 'avatar' | 'logo' | 'game-avatar') => {

    if (!userId) return;



    try {

      const fileExt = file.name.split('.').pop();

      const fileName = `${type}-${Date.now()}.${fileExt}`;

      const filePath = `${userId}/${fileName}`;



      // Detect animation type

      let animType: 'static' | 'gif' | 'lottie' | 'sprite' = 'static';

      if (file.type === 'image/gif') {

        animType = 'gif';

      } else if (file.name.endsWith('.json')) {

        animType = 'lottie';

      }

      

      const bucket = type === 'logo' ? 'logos' : 'avatars';



      // Upload to Supabase Storage

      const { error: uploadError } = await supabase.storage

        .from(bucket)

        .upload(filePath, file, {

          contentType: file.type,

          upsert: true

        });



            if (uploadError) throw uploadError;



      



            // Get public URL safely



            const { data: urlData, error: urlError } = supabase.storage



              .from(bucket)



              .getPublicUrl(filePath);



      



            if (urlError) throw urlError;



            if (!urlData?.publicUrl) throw new Error('Could not get public URL for uploaded file.');



            



            const { publicUrl } = urlData;



      



            // Update state



            if (type === 'avatar') {



              setAvatarUrl(publicUrl);

      } else if (type === 'game-avatar') {

        setGameAvatarUrl(publicUrl);

        setMascotAnimationType(animType);

      } else {

        setCompanyLogoUrl(publicUrl);

      }



      toast.success(`${animType === 'static' ? 'Image' : 'Animation'} uploaded successfully!`);

    } catch (error: any) {

      console.error('Failed to upload file:', error);

      toast.error('Failed to upload file: ' + error.message);

    }

  };



  const handleCropSave = async () => {

    console.log('handleCropSave: Initiating image crop and upload...');

    if (!imageSrc || !croppedAreaPixels || !userId || isUploading) {

      console.error('handleCropSave: Aborting, missing imageSrc, croppedAreaPixels, or userId, or upload in progress.', { hasImageSrc: !!imageSrc, hasCroppedArea: !!croppedAreaPixels, hasUserId: !!userId, isUploading });

      return;

    }



    setIsUploading(true);

    try {

      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);

      const fileName = `${cropType}-${Date.now()}.png`;

      const filePath = `${userId}/${fileName}`;

      const bucket = cropType === 'logo' ? 'logos' : 'avatars';



      console.log(`handleCropSave: Preparing to upload to bucket: ${bucket}, path: ${filePath}`);



      // Upload to Supabase Storage

      console.log('handleCropSave: Calling supabase.storage.upload...');

      const { error: uploadError } = await supabase.storage

        .from(bucket)

        .upload(filePath, croppedBlob, {

          contentType: 'image/png',

          upsert: true

        });

      console.log('handleCropSave: Supabase upload call finished.');



            if (uploadError) {



              console.error('handleCropSave: Supabase returned an error on upload.', uploadError);



              throw uploadError;



            }



      



            console.log('handleCropSave: Upload successful. Getting public URL...');



            // Get public URL safely



            const { data: urlData, error: urlError } = supabase.storage



              .from(bucket)



              .getPublicUrl(filePath);



      



            if (urlError) {



              console.error('handleCropSave: Supabase returned an error on getPublicUrl.', urlError);



              throw urlError;



            }



            if (!urlData?.publicUrl) {



              console.error('handleCropSave: Could not get public URL for uploaded file.', { urlData });



              throw new Error('Could not get public URL for uploaded file.');



            }



            



            const { publicUrl } = urlData;



            console.log(`handleCropSave: Got public URL: ${publicUrl}`);



      



            // Update state



            if (cropType === 'avatar') {

        setAvatarUrl(publicUrl);

      } else if (cropType === 'game-avatar') {

        setGameAvatarUrl(publicUrl);

      } else {

        setCompanyLogoUrl(publicUrl);

      }



      setCropDialogOpen(false);

      setImageSrc(null);

      toast.success('Image uploaded successfully!');

    } catch (error: any) {

      console.error('handleCropSave: An error occurred in the try-catch block.', error);

      toast.error('Failed to upload image: ' + error.message);

    } finally {

      setIsUploading(false);

    }

  };



  const handleSave = async () => {

    console.log('handleSave: Initiating profile save...');

    if (!userId) {

      console.error('handleSave: Aborting save, userId is null.');

      return;

    }



    console.log(`handleSave: Saving for userId: ${userId}`);

    setSaving(true);

    try {

      const updates: any = {};

      

      if (userRole === 'creator') {

        updates.full_name = fullName;

        updates.bio = bio;

        updates.avatar_url = avatarUrl;

      } else {

        updates.company_name = companyName;

        updates.company_description = companyDescription;

        updates.company_logo_url = companyLogoUrl;

      }

      

      // Both roles get design customization

      updates.design_palette = designPalette;

      updates.game_avatar_url = gameAvatarUrl;

      updates.default_particle_effect = particleEffect;

      updates.mascot_animation_type = mascotAnimationType;

      updates.primary_color = primaryColor;

      updates.secondary_color = secondaryColor;



      console.log('handleSave: Preparing to send update to Supabase with data:', updates);



      const { error } = await supabase

        .from('profiles')

        .update(updates)

        .eq('user_id', userId);

      

      console.log('handleSave: Supabase update call finished.');



      if (error) {

        console.error('handleSave: Supabase returned an error on update.', error);

        throw error;

      }



      console.log('handleSave: Update successful, calling refetchProfile...');

      await refetchProfile();

      console.log('handleSave: refetchProfile finished.');



      toast.success('Profile updated successfully!');

    } catch (error: any) {

      console.error('handleSave: An error occurred in the try-catch block.', error);

      toast.error('Failed to save profile: ' + error.message);

    } finally {

      console.log('handleSave: Reached finally block, setting saving to false.');

      setSaving(false);

    }

  };



  if (loading) {

    return (

      <div className="max-w-7xl mx-auto text-center py-12">

        <p className="text-gray-400">Loading profile...</p>

      </div>

    );

  }



  return (

    <div className="max-w-4xl mx-auto">

      <Button

        variant="ghost"

                onClick={() => navigate('/creator/dashboard')}

        style={{ color: 'hsl(var(--neon-green))' }}

      >

        <ArrowLeft className="w-4 h-4 mr-2" />

        Back to Dashboard

      </Button>



      <Card className="bg-gray-900 border-gray-800 p-8">

        <h2 className="text-2xl font-bold mb-6" style={{ color: 'hsl(var(--neon-green))' }}>

          {userRole === 'creator' ? 'Edit Creator Profile' : 'Edit Company Profile'}

        </h2>



        <div className="space-y-6">

          {userRole === 'creator' ? (

            <>

              {/* Avatar Upload */}

              <div>

                <Label className="text-white mb-2">Profile Picture</Label>

                <div className="flex items-center gap-4 mt-2">

                  <div

                    className="w-24 h-24 rounded-full border-2 flex items-center justify-center bg-black/50 overflow-hidden"

                    style={{ borderColor: 'hsl(var(--neon-green))' }}

                  >

                    {avatarUrl ? (

                      <img

                        src={avatarUrl}

                        alt="Profile"

                        className="w-full h-full object-cover"

                      />

                    ) : (

                      <User className="w-12 h-12" style={{ color: 'hsl(var(--neon-green))' }} />

                    )}

                  </div>

                  <div className="flex-1">

                    <input

                      type="file"

                      accept="image/*"

                      onChange={(e) => handleFileSelect(e, 'avatar')}

                      className="hidden"

                      id="avatar-upload"

                    />

                    <label htmlFor="avatar-upload">

                      <Button

                        type="button"

                        variant="outline"

                        className="cursor-pointer"

                        asChild

                      >

                        <span>

                          <Upload className="w-4 h-4 mr-2" />

                          Upload Image

                        </span>

                      </Button>

                    </label>

                    <p className="text-xs text-gray-500 mt-2">

                      Upload a profile picture. You'll be able to crop it after selecting.

                    </p>

                  </div>

                </div>

              </div>



              {/* Full Name */}

              <div>

                <Label htmlFor="full-name" className="text-white mb-2">

                  Full Name *

                </Label>

                <Input

                  id="full-name"

                  placeholder="Your Full Name"

                  value={fullName}

                  onChange={(e) => setFullName(e.target.value)}

                  className="bg-gray-800 border-gray-700 text-white"

                />

              </div>



              {/* Bio */}

              <div>

                <Label htmlFor="bio" className="text-white mb-2">

                  Bio *

                </Label>

                <Textarea

                  id="bio"

                  placeholder="Tell others about yourself and your game creation experience..."

                  value={bio}

                  onChange={(e) => setBio(e.target.value)}

                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"

                />

              </div>



              {/* Design Palette Settings */}

              <div>

                <h3 className="text-lg font-semibold text-white mb-2">Default Game Design</h3>

                <p className="text-sm text-gray-400 mb-4">

                  Set your default colors and font. These will be used for all your games unless you override them per game.

                </p>

                <DesignPaletteEditor

                  palette={designPalette}

                  onChange={setDesignPalette}

                />

              </div>



              {/* Particle Effect Selector */}

              <div>

                <Label className="text-white mb-2">Default Particle Effect</Label>

                <select

                  value={particleEffect}

                  onChange={(e) => setParticleEffect(e.target.value)}

                  className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"

                >

                  <option value="sparkles">✨ Sparkles (Gold Twinkles)</option>

                  <option value="coins">🪙 Coins (Golden Coins)</option>

                  <option value="stars">⭐ Stars (Bright Stars)</option>

                  <option value="hearts">❤️ Hearts (Floating Hearts)</option>

                  <option value="confetti">🎉 Confetti (Colorful Pieces)</option>

                  <option value="lightning">⚡ Lightning (Electric Bolts)</option>

                </select>

                <p className="text-xs text-gray-400 mt-2">

                  Particles will burst on interactions, correct answers, and celebrations

                </p>

              </div>

            </>

          ) : (

            <>

              {/* Company Logo Upload */}

              <div>

                <Label className="text-white mb-2">Company Logo</Label>

                <div className="flex items-center gap-4 mt-2">

                  <div

                    className="w-24 h-24 rounded-lg border-2 flex items-center justify-center bg-black/50 overflow-hidden"

                    style={{ borderColor: 'hsl(var(--neon-green))' }}

                  >

                    {companyLogoUrl ? (

                      <img

                        src={companyLogoUrl}

                        alt="Company Logo"

                        className="w-full h-full object-contain p-2"

                      />

                    ) : (

                      <Building2 className="w-12 h-12" style={{ color: 'hsl(var(--neon-green))' }} />

                    )}

                  </div>

                  <div className="flex-1">

                    <input

                      type="file"

                      accept="image/*"

                      onChange={(e) => handleFileSelect(e, 'logo')}

                      className="hidden"

                      id="logo-upload"

                    />

                    <label htmlFor="logo-upload">

                      <Button

                        type="button"

                        variant="outline"

                        className="cursor-pointer"

                        asChild

                      >

                        <span>

                          <Upload className="w-4 h-4 mr-2" />

                          Upload Logo

                        </span>

                      </Button>

                    </label>

                    <p className="text-xs text-gray-500 mt-2">

                      Upload your company logo. You'll be able to crop it after selecting.

                    </p>

                  </div>

                </div>

              </div>



              {/* Company Name */}

              <div>

                <Label htmlFor="company-name" className="text-white mb-2">

                  Company Name *

                </Label>

                <Input

                  id="company-name"

                  placeholder="Your Company Name"

                  value={companyName}

                  onChange={(e) => setCompanyName(e.target.value)}

                  className="bg-gray-800 border-gray-700 text-white"

                />

              </div>



              {/* Company Description */}

              <div>

                <Label htmlFor="company-description" className="text-white mb-2">

                  Company Description *

                </Label>

                <Textarea

                  id="company-description"

                  placeholder="Tell players about your company and what makes your games special..."

                  value={companyDescription}

                  onChange={(e) => setCompanyDescription(e.target.value)}

                  className="bg-gray-800 border-gray-700 text-white min-h-[120px]"

                />

              </div>

            </>

          )}



          {/* Design Customization - Available for both creators and brands */}

          <div className="border-t border-gray-700 pt-6 mt-6">





            {/* Game Mascot/Avatar */}

            <div className="mb-6">

              <h4 className="text-lg font-semibold text-white mb-2">Game Mascot (Default)</h4>

              <p className="text-sm text-gray-400 mb-4">

                Upload an animal, character, or icon that will appear in your games with animations and particles.

              </p>

              <div className="flex items-center gap-4">

                <div

                  className="w-32 h-32 rounded-lg border-2 flex items-center justify-center bg-black/50 overflow-hidden"

                  style={{ borderColor: 'hsl(var(--neon-purple))' }}

                >

                  {gameAvatarUrl ? (

                    <img

                      src={gameAvatarUrl}

                      alt="Game Mascot"

                      className="w-full h-full object-contain"

                    />

                  ) : (

                    <User className="w-12 h-12 text-gray-600" />

                  )}

                </div>

                <div className="flex-1">

                  <input

                    type="file"

                    accept="image/png,image/gif,image/jpeg,.json"

                    onChange={(e) => handleFileSelect(e, 'game-avatar')}

                    className="hidden"

                    id="game-avatar-upload"

                  />

                  <label htmlFor="game-avatar-upload">

                    <Button

                      type="button"

                      variant="outline"

                      className="cursor-pointer"

                      asChild

                    >

                      <span>

                        <Upload className="w-4 h-4 mr-2" />

                        Upload Mascot

                      </span>

                    </Button>

                  </label>

                  <p className="text-xs text-gray-500 mt-2">

                    Upload PNG, GIF (animated), or Lottie JSON. Your mascot will animate and react during gameplay.

                  </p>

                  {gameAvatarUrl && (

                    <p className="text-xs text-green-400 mt-1">

                      Current: {mascotAnimationType === 'gif' ? '🎬 Animated GIF' : mascotAnimationType === 'lottie' ? '✨ Lottie Animation' : '🖼️ Static Image'}

                    </p>

                  )}

                </div>

              </div>

            </div>



            {/* Particle Effect Selector */}

            <div>

              <Label className="text-white mb-2">Default Particle Effect</Label>

              <select

                value={particleEffect}

                onChange={(e) => setParticleEffect(e.target.value)}

                className="w-full p-2 rounded bg-gray-800 border border-gray-700 text-white"

              >

                <option value="sparkles">✨ Sparkles (Gold Twinkles)</option>

                <option value="confetti">🎉 Confetti (Celebration)</option>

                <option value="stars">⭐ Stars (Glowing)</option>

                <option value="hearts">❤️ Hearts (Floating)</option>

                <option value="flames">🔥 Flames (Energetic)</option>

                <option value="bubbles">💧 Bubbles (Soft)</option>

                <option value="lightning">⚡ Lightning (Electric)</option>

              </select>

              <p className="text-xs text-gray-500 mt-2">

                Choose the default particle effect that appears when players interact with your mascot.

              </p>

            </div>



            {/* Brand Colors - For brands only */}

            {userRole === 'brand' && (

              <div className="grid grid-cols-2 gap-4 mt-6">

                <div className="space-y-2">

                  <Label htmlFor="primaryColor" className="text-white">Primary Brand Color</Label>

                  <div className="flex gap-2">

                    <Input

                      id="primaryColor"

                      type="color"

                      value={primaryColor}

                      onChange={(e) => setPrimaryColor(e.target.value)}

                      className="w-20 h-10 p-1 cursor-pointer"

                    />

                    <Input

                      type="text"

                      value={primaryColor}

                      onChange={(e) => setPrimaryColor(e.target.value)}

                      className="flex-1 bg-gray-800 border-gray-700 text-white"

                    />

                  </div>

                  <p className="text-xs text-gray-400">Main brand color for demos</p>

                </div>



                <div className="space-y-2">

                  <Label htmlFor="secondaryColor" className="text-white">Secondary Brand Color</Label>

                  <div className="flex gap-2">

                    <Input

                      id="secondaryColor"

                      type="color"

                      value={secondaryColor}

                      onChange={(e) => setSecondaryColor(e.target.value)}

                      className="w-20 h-10 p-1 cursor-pointer"

                    />

                    <Input

                      type="text"

                      value={secondaryColor}

                      onChange={(e) => setSecondaryColor(e.target.value)}

                      className="flex-1 bg-gray-800 border-gray-700 text-white"

                    />

                  </div>

                  <p className="text-xs text-gray-400">Accent color for demos</p>

                </div>

              </div>

            )}

          </div>



          {/* Actions */}

          <div className="flex gap-3 pt-4">

            <Button

              variant="outline"

                            onClick={() => navigate('/creator/dashboard')}

            >

              Cancel

            </Button>

            <Button

              onClick={handleSave}

              disabled={

                saving ||

                (userRole === 'creator' ? !fullName || !bio : !companyName || !companyDescription)

              }

              className="flex-1 bg-neon-green text-white hover:bg-neon-green/90"

            >

              {saving ? 'Saving...' : 'Save Profile'}

            </Button>

          </div>

        </div>

      </Card>



      {/* Crop Dialog */}

      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>

        <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl">

          <DialogHeader>

            <DialogTitle className="text-white">Crop Image</DialogTitle>

          </DialogHeader>

          <div className="space-y-4">

            <div className="relative h-[400px] bg-black rounded-lg overflow-hidden">

              {imageSrc && (

                <Cropper

                  image={imageSrc}

                  crop={crop}

                  zoom={zoom}

                  aspect={cropType === 'avatar' || cropType === 'game-avatar' ? 1 : 16 / 9}

                  onCropChange={setCrop}

                  onZoomChange={setZoom}

                  onCropComplete={onCropComplete}

                />

              )}

            </div>

            <div className="space-y-2">

              <Label className="text-white">Zoom</Label>

              <input

                type="range"

                min={1}

                max={3}

                step={0.1}

                value={zoom}

                onChange={(e) => setZoom(Number(e.target.value))}

                className="w-full"

              />

            </div>

            <div className="flex gap-3">

              <Button

                variant="outline"

                onClick={() => setCropDialogOpen(false)}

                className="flex-1"

              >

                Cancel

              </Button>

              <Button

                onClick={handleCropSave}

                className="flex-1 bg-neon-green text-white hover:bg-neon-green/90"

                disabled={isUploading}

              >

                {isUploading ? 'Uploading...' : 'Save & Upload'}

              </Button>

            </div>

          </div>

        </DialogContent>

      </Dialog>

    </div>

  );

}
