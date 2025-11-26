import { useState } from 'react';
import styles from './Sidebar.module.css';

export function CommentsPanel({ selectedTile, comments, onAddComment, isReadOnly = false }) {
  const [newComment, setNewComment] = useState('');

  const handleAddComment = () => {
    if (newComment.trim() && selectedTile) {
      onAddComment(selectedTile.id, newComment);
      setNewComment('');
    }
  };

  if (!selectedTile) {
    return (
      <div className={styles.commentsList}>
        <p className={styles.hint}>Select a tile to view comments</p>
      </div>
    );
  }

  return (
    <>
      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.hint}>No comments yet</p>
        ) : (
          comments.map((comment, index) => (
            <div key={index} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <span className={styles.commentUser}>{comment.user}</span>
                <span className={styles.commentTime}>{comment.timestamp}</span>
              </div>
              <div className={styles.commentText}>{comment.text}</div>
            </div>
          ))
        )}
      </div>
      {!isReadOnly && (
        <div className={styles.addCommentSection}>
          <div className={styles.formGroup}>
            <textarea
              placeholder="Add a comment..."
              rows="3"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
            />
          </div>
          <button
            className={`${styles.btn} ${styles.btnPrimary}`}
            onClick={handleAddComment}
          >
            Add Comment
          </button>
        </div>
      )}
      {isReadOnly && (
        <p className={styles.hint}>Sign in with Discord to add comments</p>
      )}
    </>
  );
}
