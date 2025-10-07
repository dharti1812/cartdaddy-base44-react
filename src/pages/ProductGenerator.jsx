import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Loader2, CheckCircle, AlertCircle, Eye, Edit, Save } from 'lucide-react';
import { GenerationJob, Product } from '@/api/entities';
// import { generateProduct } from '@/api/functions';

function JobStatusCard({ job, onSelect }) {
  const statusConfig = {
    queued: { icon: Loader2, color: 'text-gray-500', bgColor: 'bg-gray-100', label: 'Queued' },
    running: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Running' },
    generating_text: { icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100', label: 'Writing Text' },
    generating_images: { icon: Loader2, color: 'text-purple-500', bgColor: 'bg-purple-100', label: 'Creating Images' },
    success: { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', label: 'Success' },
    failed: { icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-100', label: 'Failed' },
  };
  const config = statusConfig[job.status] || statusConfig.queued;
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <p className="font-semibold">{job.product_name}</p>
          <p className="text-xs text-gray-500">Job ID: {job.id.slice(0, 8)}...</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={`${config.bgColor} ${config.color} gap-1.5`}>
            <Icon className={`w-4 h-4 ${job.status === 'running' || job.status.startsWith('generating') ? 'animate-spin' : ''}`} />
            {config.label}
          </Badge>
          <Button size="sm" variant="outline" onClick={() => onSelect(job)}>
            <Eye className="w-4 h-4 mr-2" /> View
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ProductGeneratorPage() {
  const [name, setName] = useState('');
  const [urls, setUrls] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [editingData, setEditingData] = useState(null);

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 5000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    const jobData = await GenerationJob.list('-created_date', 50);
    setJobs(jobData);
  };

  const handleGenerate = async () => {
    if (!name || !urls) {
      setError('Product Name and at least one Reference URL are required.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const reference_urls = urls.split('\\n').filter(Boolean);
      await generateProduct({
        name,
        reference_urls,
        webhook_url: webhookUrl,
        image_mode: 'generate_or_transform'
      });
      setName('');
      setUrls('');
      loadJobs();
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const handleSaveProduct = async () => {
    if (!editingData) return;
    setLoading(true);
    await Product.create({
      ...editingData,
      status: 'published'
    });
    setLoading(false);
    setSelectedJob(null);
    setEditingData(null);
    // Optionally navigate to a products page
  };
  
  if (selectedJob && selectedJob.generated_data) {
     const dataToEdit = editingData || selectedJob.generated_data;
     return (
      <div className="p-8 max-w-4xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Review & Approve Product</h1>
        <Card>
            <CardHeader><CardTitle>{dataToEdit.title}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label>Bullet Points</Label>
                    <ul className="list-disc pl-5 space-y-1">
                        {dataToEdit.bullets.map((b, i) => <li key={i}>{b}</li>)}
                    </ul>
                </div>
                 <div>
                    <Label>Description</Label>
                    <div className="prose" dangerouslySetInnerHTML={{__html: dataToEdit.description_html}} />
                </div>
                <div>
                    <Label>Images</Label>
                    <div className="grid grid-cols-4 gap-2">
                        {dataToEdit.images.map((img,i) => <img key={i} src={img.url} className="rounded-lg border"/>)}
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setSelectedJob(null)}>Back</Button>
                <Button onClick={handleSaveProduct} disabled={loading}>
                    <CheckCircle className="w-4 h-4 mr-2" /> {loading ? 'Saving...' : 'Save and Publish'}
                </Button>
            </CardFooter>
        </Card>
      </div>
     )
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto grid gap-8">
        {/* Generator Card */}
        <Card className="shadow-lg border-t-4 border-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="w-6 h-6 text-blue-500" />
              AI Product Page Generator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Apple iPhone 15 128GB Blue" />
            </div>
            <div>
              <Label htmlFor="urls">Reference URLs (one per line)</Label>
              <Textarea id="urls" value={urls} onChange={(e) => setUrls(e.target.value)} placeholder="https://www.amazon.in/...\\nhttps://www.flipkart.com/..." />
            </div>
            <div>
              <Label htmlFor="webhook">Webhook URL (Optional)</Label>
              <Input id="webhook" value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="Your Laravel endpoint to receive status updates" />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleGenerate} disabled={loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Product Page
            </Button>
          </CardFooter>
        </Card>

        {/* Jobs Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Generation Jobs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
            {jobs.length > 0 ? (
              jobs.map(job => <JobStatusCard key={job.id} job={job} onSelect={setSelectedJob} />)
            ) : (
              <p className="text-center text-gray-500 py-8">No generation jobs yet. Create one above to get started!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}