import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-announcement',
  imports: [CommonModule, FormsModule],
  templateUrl: './announcement.html',
  styleUrl: './announcement.css',
})
export class Announcement {
  announcements = signal<any[]>([
    {
      id: 1,
      author: 'HR Communications',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100&h=100&auto=format&fit=crop',
      time: '2 hours ago',
      type: 'post',
      title: '✨ Friday Fun Day: Bollywood Theme!',
      content: 'Get ready for some excitement! This Friday we are celebrating with a Bollywood theme. Best dressed wins a special surprise voucher. Join us at the cafeteria at 4 PM.',
      image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=800&auto=format&fit=crop',
      likes: 24,
      hasLiked: false,
      comments: [
        { user: 'Rahul M.', text: "Can't wait for this! 💃", time: '1h ago' },
        { user: 'Sonia K.', text: 'I already have my outfit ready!', time: '30m ago' }
      ],
      newComment: '',
      showComments: false
    },
    {
      id: 2,
      author: 'Operations Desk',
      role: 'Admin',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100&h=100&auto=format&fit=crop',
      time: '5 hours ago',
      type: 'poll',
      title: '📊 Next Team Outing Preference',
      content: 'Where should we go for our quarterly team outing? Cast your vote below!',
      likes: 12,
      hasLiked: false,
      poll: {
        totalVotes: 85,
        voted: false,
        options: [
          { id: 1, label: 'Go-Karting & Bowling', votes: 45 },
          { id: 2, label: 'Resort Day Out', votes: 30 },
          { id: 3, label: 'Fine Dining Night', votes: 10 }
        ]
      },
      comments: [],
      newComment: '',
      showComments: false
    }
  ]);

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

  likePost(id: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === id) {
        return { ...p, likes: p.hasLiked ? p.likes - 1 : p.likes + 1, hasLiked: !p.hasLiked };
      }
      return p;
    }));
  }

  addComment(id: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === id && p.newComment.trim()) {
        const updatedComments = [...p.comments, { 
          user: 'You', 
          text: p.newComment, 
          time: 'Just now',
          isUser: true // Flag to identify current user's comments
        }];
        return { ...p, comments: updatedComments, newComment: '' };
      }
      return p;
    }));
  }

  deleteComment(postId: number, commentIndex: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === postId) {
        const updatedComments = p.comments.filter((_: any, index: number) => index !== commentIndex);
        return { ...p, comments: updatedComments };
      }
      return p;
    }));
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

  votePoll(postId: number, optionId: number) {
    this.announcements.update((posts: any[]) => posts.map((p: any) => {
      if (p.id === postId && !p.poll?.voted) {
        const updatedOptions = p.poll!.options.map((opt: any) => 
          opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
        );
        return { ...p, poll: { ...p.poll!, options: updatedOptions, totalVotes: p.poll!.totalVotes + 1, voted: true } };
      }
      return p;
    }));
  }

  getPollPercentage(votes: number, total: number): string {
    return Math.round((votes / total) * 100) + '%';
  }
}
