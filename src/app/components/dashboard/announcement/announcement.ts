import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../services/api.service';

@Component({
  selector: 'app-announcement',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './announcement.html',
  styleUrl: './announcement.css',
})
export class Announcement implements OnInit {
  private apiService = inject(ApiService);
  
  // Role & User State
  isAdmin = signal(false);
  currentUser = signal<any>(null);
  isLoading = signal(false);

  // Announcements Feed
  announcements = signal<any[]>([]);

  // Form State (Signals for better reactivity)
  activeTab = signal('post');
  newPostTitle = signal('');
  newPostContent = signal('');
  newPostImage = signal('');
  
  newPollTitle = signal('');
  newPollContent = signal('');
  pollOptions = signal([{ label: '' }, { label: '' }]);

  // Editing State
  isEditingAnnouncement = signal(false);
  editingAnnouncementId = signal<string | null>(null);

  ngOnInit() {
    this.loadUser();
    this.loadAnnouncements();
  }

  loadAnnouncements() {
    this.isLoading.set(true);
    this.apiService.getAnnouncements().subscribe({
      next: (res) => {
        if (res.success) {
          const mapped = res.data.map((p: any) => {
            const authorName = p.author ? `${p.author.firstName} ${p.author.lastName}` : 'Admin';
            const userId = this.currentUser()?._id || this.currentUser()?.id;
            
            return {
              ...p,
              id: p._id,
              author: authorName,
              role: 'Admin', // Assuming only admins post for now
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&h=100&auto=format&fit=crop',
              time: this.formatTime(p.createdAt),
              type: p.type.toLowerCase(),
              image: p.imageUrl,
              likes: p.likes.length,
              hasLiked: p.likes.includes(userId),
              comments: p.comments.map((c: any) => ({
                id: c._id,
                user: c.user ? `${c.user.firstName} ${c.user.lastName}` : 'User',
                text: c.text,
                time: this.formatTime(c.date),
                isUser: c.user?._id === userId || c.user === userId,
                isFlagged: c.isFlagged
              })),
              newComment: '',
              showComments: false,
              poll: p.type === 'Poll' ? {
                totalVotes: p.pollOptions.reduce((acc: number, opt: any) => acc + opt.votes, 0),
                voted: p.pollOptions.some((opt: any) => opt.voters.includes(userId)),
                options: p.pollOptions.map((opt: any, idx: number) => ({
                  id: opt._id || idx,
                  label: opt.label,
                  votes: opt.votes
                }))
              } : null
            };
          });
          this.announcements.set(mapped);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading announcements:', err);
        this.isLoading.set(false);
      }
    });
  }

  private formatTime(dateStr: string) {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMins < 60) return `${diffInMins}m ago`;
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${diffInDays}d ago`;
  }

  private loadUser() {
    try {
      const savedUser = localStorage.getItem('currentUser');
      if (savedUser) {
        const user = JSON.parse(savedUser);
        this.currentUser.set(user);
        this.isAdmin.set(user.role?.toLowerCase() === 'admin');
      }
    } catch (e) {
      console.error('Error loading user:', e);
    }
  }

  addPollOption() {
    this.pollOptions.update(opts => [...opts, { label: '' }]);
  }

  removePollOption(index: number) {
    this.pollOptions.update(opts => opts.filter((_, i) => i !== index));
  }

  createPost() {
    if (!this.newPostTitle().trim() || !this.newPostContent().trim()) {
      alert('Please fill in both title and content.');
      return;
    }

    const postData = {
      title: this.newPostTitle(),
      content: this.newPostContent(),
      type: 'Post',
      imageUrl: this.newPostImage()
    };

    this.isLoading.set(true);
    const request = this.isEditingAnnouncement() && this.editingAnnouncementId()
      ? this.apiService.updateAnnouncement(this.editingAnnouncementId()!, postData)
      : this.apiService.createAnnouncement(postData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements(); // Reload feed
          this.resetForm();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error saving post:', err);
        this.isLoading.set(false);
        
        let errorMsg = 'Failed to save post.';
        if (err.status === 413) {
          errorMsg = 'Image size is too large. Please use a smaller image.';
        } else if (err.error) {
          errorMsg = err.error.message || err.error.error || err.error;
        }
        
        alert(`${errorMsg} (Status: ${err.status})`);
      }
    });
  }

  createPoll() {
    if (!this.newPollTitle().trim() || this.pollOptions().some(o => !o.label.trim())) {
      alert('Please fill in the question and all options.');
      return;
    }

    const pollData = {
      title: this.newPollTitle(),
      content: this.newPollContent() || 'Cast your vote below',
      type: 'Poll',
      pollOptions: this.pollOptions().map(opt => ({ label: opt.label }))
    };

    this.isLoading.set(true);
    const request = this.isEditingAnnouncement() && this.editingAnnouncementId()
      ? this.apiService.updateAnnouncement(this.editingAnnouncementId()!, pollData)
      : this.apiService.createAnnouncement(pollData);

    request.subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements();
          this.resetForm();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error saving poll:', err);
        this.isLoading.set(false);
        alert('Failed to save poll.');
      }
    });
  }

  deleteAnnouncement(id: string) {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    this.isLoading.set(true);
    this.apiService.deleteAnnouncement(id).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements();
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error deleting announcement:', err);
        this.isLoading.set(false);
        alert('Failed to delete announcement.');
      }
    });
  }

  startEditAnnouncement(post: any) {
    this.isEditingAnnouncement.set(true);
    this.editingAnnouncementId.set(post.id);
    this.activeTab.set(post.type.toLowerCase());

    if (post.type.toLowerCase() === 'post') {
      this.newPostTitle.set(post.title);
      this.newPostContent.set(post.content);
      this.newPostImage.set(post.image || '');
    } else {
      this.newPollTitle.set(post.title);
      this.newPollContent.set(post.content || '');
      this.pollOptions.set(post.poll.options.map((o: any) => ({ label: o.label })));
    }

    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.newPostTitle.set('');
    this.newPostContent.set('');
    this.newPostImage.set('');
    this.newPollTitle.set('');
    this.newPollContent.set('');
    this.pollOptions.set([{ label: '' }, { label: '' }]);
    this.isEditingAnnouncement.set(false);
    this.editingAnnouncementId.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.newPostImage.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeSelectedImage() {
    this.newPostImage.set('');
  }


  toggleCommentMenu(postId: number, commentIndex: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === postId) {
        return { ...p, menuIndex: p.menuIndex === commentIndex ? null : commentIndex };
      }
      return p;
    }));
  }

  closeCommentMenu(postId: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === postId) {
        return { ...p, menuIndex: null };
      }
      return p;
    }));
  }

  toggleComments(id: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === id) {
        return { ...p, showComments: !p.showComments };
      }
      return p;
    }));
  }

  likePost(id: string) {
    this.apiService.toggleLike(id).subscribe({
      next: (res) => {
        if (res.success) {
          const userId = this.currentUser()?._id || this.currentUser()?.id;
          this.announcements.update((posts: any[]) => posts.map((p: any) => {
            if (p.id === id) {
              const hasLiked = res.data.includes(userId);
              return { ...p, likes: res.data.length, hasLiked: hasLiked };
            }
            return p;
          }));
        }
      }
    });
  }

  addComment(id: string) {
    const post = this.announcements().find(p => p.id === id);
    if (!post || !post.newComment.trim()) return;

    this.apiService.addComment(id, post.newComment).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements(); // Refresh to show new comment with full data
        }
      },
      error: (err) => {
        console.error('Error adding comment:', err);
        alert('Failed to add comment.');
      }
    });
  }

  deleteComment(postId: string, commentId: string) {
    this.apiService.deleteComment(postId, commentId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements();
        }
      },
      error: (err) => {
        console.error('Error deleting comment:', err);
        alert('Failed to delete comment.');
      }
    });
  }

  toggleFlagComment(postId: string, commentId: string) {
    if (!this.isAdmin()) return;

    this.apiService.toggleFlagComment(postId, commentId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements();
        }
      },
      error: (err) => {
        console.error('Error flagging comment:', err);
        alert('Failed to flag/unflag comment.');
      }
    });
  }

  startEditComment(postId: number, commentIndex: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === postId) {
        return { ...p, editingIndex: commentIndex, editText: p.comments[commentIndex].text };
      }
      return p;
    }));
  }

  cancelEditComment(postId: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === postId) {
        return { ...p, editingIndex: null, editText: '' };
      }
      return p;
    }));
  }

  saveEditComment(postId: number, commentIndex: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === postId && p.editText.trim()) {
        const updatedComments = p.comments.map((c: any, index: number) => 
          index === commentIndex ? { ...c, text: p.editText, time: 'Edited just now' } : c
        );
        return { ...p, comments: updatedComments, editingIndex: null, editText: '' };
      }
      return p;
    }));
  }

  votePoll(postId: string, optionId: string) {
    this.apiService.votePoll(postId, optionId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadAnnouncements(); // Refresh data to show updated votes
        }
      },
      error: (err) => {
        console.error('Error voting:', err);
        alert(err.error?.message || 'Failed to submit vote.');
      }
    });
  }

  getPollPercentage(votes: number, total: number): string {
    return Math.round((votes / total) * 100) + '%';
  }
}
