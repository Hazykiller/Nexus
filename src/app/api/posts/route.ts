import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runQuery, runWriteQuery } from '@/lib/neo4j';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/lib/storage';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;

    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get('cursor') || '0';
    const limit = 10;
    const type = searchParams.get('type') || 'home';
    const targetId = searchParams.get('userId');
    const reqAura = searchParams.get('aura');

    let cypher = '';
    const params: Record<string, unknown> = { userId, cursor, limit, targetId, reqAura: reqAura || null };

    if (type === 'home') {
      cypher = `
        MATCH (me:User {id: $userId})
        MATCH (author:User)-[:CREATED]->(p:Post)
        WHERE (
          (me)-[:FOLLOWS]->(author) 
          OR (me)-[:CLOSE_FRIEND]->(author)
          OR author.id = $userId
        )
        // Close Friends visibility constraint
        AND (
          p.visibility <> 'close_friends' 
          OR (p.visibility = 'close_friends' AND (author.id = $userId OR (author)-[:CLOSE_FRIEND]->(me)))
        )
        // Private post constraint if just simple following
        AND (
          p.visibility <> 'private'
          OR (p.visibility = 'private' AND (author.id = $userId OR (author)-[:FOLLOWS]->(me)))
        )
        AND NOT (me)-[:BLOCKED]->(author) AND NOT (author)-[:BLOCKED]->(me)
        AND coalesce(p.isDeleted, false) = false
        AND ($reqAura IS NULL OR p.aura = $reqAura)
        
        OPTIONAL MATCH (p)<-[likes:LIKES]-()
        OPTIONAL MATCH (p)<-[reacts:REACTED]-()
        OPTIONAL MATCH (p)<-[:CREATED]-(cm:Comment)
        OPTIONAL MATCH (p)<-[:SHARED_POST]-(shared:Post)
        OPTIONAL MATCH (me)-[myLike:LIKES]->(p)
        OPTIONAL MATCH (me)-[myReact:REACTED]->(p)
        OPTIONAL MATCH (me)-[mySave:SAVED]->(p)
        OPTIONAL MATCH (p)-[:HAS_TAG]->(tag:Hashtag)
        WITH p, author,
             COUNT(DISTINCT likes) + COUNT(DISTINCT reacts) AS likeCount,
             COUNT(DISTINCT cm) AS commentCount,
             COUNT(DISTINCT shared) AS shareCount,
             myLike IS NOT NULL AS isLiked,
             myReact.type AS myReaction,
             mySave IS NOT NULL AS isSaved,
             p.aura AS aura,
             COLLECT(DISTINCT tag.name) AS hashtags
        RETURN p, author, likeCount, commentCount, shareCount, isLiked, myReaction, isSaved, aura, hashtags
        ORDER BY p.createdAt DESC
        SKIP toInteger($cursor) LIMIT toInteger($limit)`;
    } else if (type === 'user') {
      // All posts created by targetUserId
      cypher = `
        MATCH (author:User {id: $targetId})-[:CREATED]->(p:Post)
        WHERE (p.visibility = 'public' OR author.id = $userId)
        AND coalesce(p.isDeleted, false) = false
        AND ($reqAura IS NULL OR p.aura = $reqAura)
        OPTIONAL MATCH (p)<-[likes:LIKES]-()
        OPTIONAL MATCH (p)<-[reacts:REACTED]-()
        OPTIONAL MATCH (p)<-[:CREATED]-(cm:Comment)
        OPTIONAL MATCH (p)<-[:SHARED_POST]-(shared:Post)
        OPTIONAL MATCH (me:User {id: $userId})-[myLike:LIKES]->(p)
        OPTIONAL MATCH (me)-[myReact:REACTED]->(p)
        OPTIONAL MATCH (me)-[mySave:SAVED]->(p)
        OPTIONAL MATCH (p)-[:HAS_TAG]->(tag:Hashtag)
        WITH p, author,
             COUNT(DISTINCT likes) + COUNT(DISTINCT reacts) AS likeCount,
             COUNT(DISTINCT cm) AS commentCount,
             COUNT(DISTINCT shared) AS shareCount,
             myLike IS NOT NULL AS isLiked,
             myReact.type AS myReaction,
             mySave IS NOT NULL AS isSaved,
             p.aura AS aura,
             COLLECT(DISTINCT tag.name) AS hashtags
        RETURN p, author, likeCount, commentCount, shareCount, isLiked, myReaction, isSaved, aura, hashtags
        ORDER BY p.createdAt DESC
        SKIP toInteger($cursor) LIMIT toInteger($limit)`;
    } else if (type === 'likes') {
      // Posts liked by THIS user (targetId must be self)
      if (targetId && targetId !== userId) {
        return NextResponse.json({ error: 'Private' }, { status: 403 });
      }
      cypher = `
        MATCH (me:User {id: $userId})-[l:LIKES]->(p:Post)
        MATCH (author:User)-[:CREATED]->(p)
        WHERE coalesce(p.isDeleted, false) = false
        OPTIONAL MATCH (p)<-[likes:LIKES]-()
        OPTIONAL MATCH (p)<-[reacts:REACTED]-()
        OPTIONAL MATCH (p)<-[:CREATED]-(cm:Comment)
        OPTIONAL MATCH (p)<-[:SHARED_POST]-(shared:Post)
        OPTIONAL MATCH (me)-[myLike:LIKES]->(p)
        OPTIONAL MATCH (me)-[myReact:REACTED]->(p)
        OPTIONAL MATCH (me)-[mySave:SAVED]->(p)
        OPTIONAL MATCH (p)-[:HAS_TAG]->(tag:Hashtag)
        WITH p, author, l,
             COUNT(DISTINCT likes) + COUNT(DISTINCT reacts) AS likeCount,
             COUNT(DISTINCT cm) AS commentCount,
             COUNT(DISTINCT shared) AS shareCount,
             myLike IS NOT NULL AS isLiked,
             myReact.type AS myReaction,
             mySave IS NOT NULL AS isSaved,
             p.aura AS aura,
             COLLECT(DISTINCT tag.name) AS hashtags
        RETURN p, author, likeCount, commentCount, shareCount, isLiked, myReaction, isSaved, aura, hashtags
        ORDER BY l.createdAt DESC
        SKIP toInteger($cursor) LIMIT toInteger($limit)`;
    } else if (type === 'saved') {
      // Posts saved by THIS user (targetId must be self)
      if (targetId && targetId !== userId) {
        return NextResponse.json({ error: 'Private' }, { status: 403 });
      }
      cypher = `
        MATCH (me:User {id: $userId})-[s:SAVED]->(p:Post)
        MATCH (author:User)-[:CREATED]->(p)
        WHERE coalesce(p.isDeleted, false) = false
        OPTIONAL MATCH (p)<-[likes:LIKES]-()
        OPTIONAL MATCH (p)<-[reacts:REACTED]-()
        OPTIONAL MATCH (p)<-[:CREATED]-(cm:Comment)
        OPTIONAL MATCH (p)<-[:SHARED_POST]-(shared:Post)
        OPTIONAL MATCH (me)-[myLike:LIKES]->(p)
        OPTIONAL MATCH (me)-[myReact:REACTED]->(p)
        OPTIONAL MATCH (me)-[mySave:SAVED]->(p)
        OPTIONAL MATCH (p)-[:HAS_TAG]->(tag:Hashtag)
        WITH p, author, s,
             COUNT(DISTINCT likes) + COUNT(DISTINCT reacts) AS likeCount,
             COUNT(DISTINCT cm) AS commentCount,
             COUNT(DISTINCT shared) AS shareCount,
             myLike IS NOT NULL AS isLiked,
             myReact.type AS myReaction,
             mySave IS NOT NULL AS isSaved,
             p.aura AS aura,
             COLLECT(DISTINCT tag.name) AS hashtags
        RETURN p, author, likeCount, commentCount, shareCount, isLiked, myReaction, isSaved, aura, hashtags
        ORDER BY s.createdAt DESC
        SKIP toInteger($cursor) LIMIT toInteger($limit)`;
    } else {
      // Explore Algorithm (Collaborative Filtering + Cold Start Rules)
      cypher = `
        MATCH (me:User {id: $userId})
        
        // Discover Collaborative Filter Vectors
        OPTIONAL MATCH (me)-[:LIKES]->(:Post)-[:HAS_TAG]->(likedTag:Hashtag)
        WITH me, COLLECT(DISTINCT likedTag) as likedTags
        OPTIONAL MATCH (me)-[:FOLLOWS]->(:User)-[:FOLLOWS]->(f2:User)
        WITH me, likedTags, COLLECT(DISTINCT f2) as f2s
        
        MATCH (author:User)-[:CREATED]->(p:Post)
        WHERE p.visibility = 'public'
        AND author <> me
        AND NOT (me)-[:BLOCKED]-(author)
        AND coalesce(p.isDeleted, false) = false
        AND ($reqAura IS NULL OR p.aura = $reqAura)
        
        // Calculate Proximity Scores
        OPTIONAL MATCH (p)-[:HAS_TAG]->(t:Hashtag)
        WITH p, author, likedTags, f2s,
             CASE WHEN t IN likedTags THEN 10 ELSE 0 END as tagScore,
             CASE WHEN author IN f2s THEN 15 ELSE 0 END as networkScore
             
        WITH p, author, MAX(tagScore) + MAX(networkScore) as algoScore, size(likedTags) as likedTagsSize, size(f2s) as f2sSize
        
        // Cold Start Validation
        WHERE (likedTagsSize = 0 AND f2sSize = 0) OR algoScore > 0

        OPTIONAL MATCH (p)<-[likes:LIKES]-()
        OPTIONAL MATCH (p)<-[reacts:REACTED]-()
        OPTIONAL MATCH (p)<-[:CREATED]-(cm:Comment)
        OPTIONAL MATCH (p)<-[:SHARED_POST]-(shared:Post)
        OPTIONAL MATCH (me:User {id: $userId})-[myLike:LIKES]->(p)
        OPTIONAL MATCH (me2:User {id: $userId})-[myReact:REACTED]->(p)
        OPTIONAL MATCH (me3:User {id: $userId})-[mySave:SAVED]->(p)
        OPTIONAL MATCH (p)-[:HAS_TAG]->(tag:Hashtag)
        WITH p, author, algoScore,
             COUNT(DISTINCT likes) + COUNT(DISTINCT reacts) AS likeCount,
             COUNT(DISTINCT cm) AS commentCount,
             COUNT(DISTINCT shared) AS shareCount,
             myLike IS NOT NULL AS isLiked,
             myReact.type AS myReaction,
             mySave IS NOT NULL AS isSaved,
             p.aura AS aura,
             COLLECT(DISTINCT tag.name) AS hashtags
        RETURN p, author, likeCount, commentCount, shareCount, isLiked, myReaction, isSaved, aura, hashtags
        ORDER BY algoScore DESC, likeCount DESC, p.createdAt DESC
        SKIP toInteger($cursor) LIMIT toInteger($limit)`;
    }

    const results = await runQuery(cypher, params);

    const posts = results.map((r) => {
      const post = r.p as Record<string, unknown>;
      const authorData = r.author as Record<string, unknown>;
      delete authorData.password;
      return {
        ...post,
        author: authorData,
        likesCount: r.likeCount ?? 0,
        commentsCount: r.commentCount ?? 0,
        sharesCount: r.shareCount ?? 0,
        isLiked: r.isLiked ?? false,
        myReaction: r.myReaction,
        isSaved: r.isSaved ?? false,
        aura: r.aura,
        hashtags: r.hashtags ?? [],
        reactions: {},
        mentions: [],
        images: post.images || [],
      };
    });

    return NextResponse.json({
      success: true,
      data: posts,
      nextCursor: posts.length === limit ? String(Number(cursor) + limit) : undefined,
      hasMore: posts.length === limit,
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = (session.user as Record<string, unknown>).id as string;
    const isVerified = (session.user as Record<string, unknown>).verified as boolean;

    if (!isVerified) {
      return NextResponse.json({ error: 'Account verification required to post content' }, { status: 403 });
    }

    const contentType = req.headers.get('content-type') || '';
    console.log('--- POST /api/posts DEBUG ---');
    console.log('Content-Type:', contentType);

    let content, images, video, location, visibility, aura, hashtags, mentions, groupId;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      console.log('FormData received');
      content = formData.get('content') as string;
      visibility = (formData.get('visibility') as string) || 'public';
      aura = formData.get('aura') as string | undefined;
      location = formData.get('location') as string;
      hashtags = JSON.parse((formData.get('hashtags') as string) || '[]');
      mentions = JSON.parse((formData.get('mentions') as string) || '[]');
      groupId = formData.get('groupId') as string;

      // Process file uploads
      const imageFiles = formData.getAll('images') as File[];
      const videoFile = formData.get('video') as File | null;
      console.log('Image files count:', imageFiles.length);

      images = await Promise.all(imageFiles.map((file) => {
        console.log('Uploading file:', file.name, 'size:', file.size);
        return uploadFile(file);
      }));
      video = videoFile && videoFile.size > 0 ? await uploadFile(videoFile) : null;
      if (video) console.log('Video uploaded:', video);
    } else {
      console.log('JSON body received');
      const body = await req.json();
      content = body.content;
      images = body.images;
      video = body.video;
      location = body.location;
      visibility = body.visibility;
      aura = body.aura;
      hashtags = body.hashtags;
      mentions = body.mentions;
      groupId = body.groupId;
    }

    if (!content && (!images || images.length === 0) && !video) {
      return NextResponse.json({ error: 'Post must have content or media' }, { status: 400 });
    }

    let isDeleted = false;
    let moderationReason = '';

    // OpenRouter AI Auto-Moderation Pipeline (Live Content Analysis)
    if (content) {
      const openRouterKey = process.env.OPENROUTER_API_KEY;
      if (openRouterKey) {
        try {
          const modRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${openRouterKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'openai/gpt-3.5-turbo',
              messages: [{
                role: 'system',
                content: 'Analyze the text for extreme hate speech, severe toxicity, explicit harm, or severe spam. If it contains any, respond EXACTLY with "FLAGGED: [Reason]". Otherwise respond exactly with "SAFE". Be lenient for casual social context.'
              }, { role: 'user', content }]
            })
          });
          const modJson = await modRes.json();
          const modReply = modJson.choices?.[0]?.message?.content || 'SAFE';
          
          if (modReply.startsWith('FLAGGED:')) {
            isDeleted = true;
            moderationReason = modReply;
            console.log('AI Auto-Moderator Flagged Post:', modReply);
            
            // Increment User Risk Score (Level 0->3 mapping done on client/admin display)
            await runWriteQuery(
              `MATCH (u:User {id: $userId})
               SET u.riskScore = coalesce(u.riskScore, 0) + 1`,
              { userId }
            );
          }
        } catch(e) { 
          console.error('OpenRouter Moderation Execution Error:', e); 
        }
      }
    }

    const postId = uuidv4();

    // Create post (or tombstoned post if moderated)
    await runWriteQuery(
      `MATCH (u:User {id: $userId})
       CREATE (u)-[:CREATED]->(p:Post {
         id: $postId,
         content: $content,
         images: $images,
         video: $video,
         location: $location,
         visibility: $visibility,
         aura: $aura,
         isDeleted: $isDeleted,
         moderationReason: $moderationReason,
         createdAt: datetime(),
         updatedAt: datetime()
       })`,
      {
        userId,
        postId,
        content: content || '',
        images: images || [],
        video: video || '',
        location: location || '',
        visibility: visibility || 'public',
        aura: aura || null,
        isDeleted,
        moderationReason
      }
    );

    if (isDeleted) {
       return NextResponse.json({ error: `Your post was auto-removed containing illicit content. Reason: ${moderationReason}` }, { status: 403 });
    }

    // Create hashtag relationships
    if (hashtags && hashtags.length > 0) {
      for (const tag of hashtags) {
        await runWriteQuery(
          `MATCH (p:Post {id: $postId})
           MERGE (h:Hashtag {name: toLower($tag)})
           ON CREATE SET h.createdAt = datetime()
           MERGE (p)-[:HAS_TAG]->(h)`,
          { postId, tag }
        );
      }
    }

    // Group assignment
    if (groupId) {
      await runWriteQuery(
        `MATCH (p:Post {id: $postId}), (g:Group {id: $groupId})
         CREATE (p)-[:BELONGS_TO]->(g)`,
        { postId, groupId }
      );
    }

    // Mention notifications
    if (mentions && mentions.length > 0) {
      for (const username of mentions) {
        await runWriteQuery(
          `MATCH (actor:User {id: $userId}), (target:User {username: $username})
           CREATE (n:Notification {
             id: randomUUID(),
             type: 'mention',
             message: actor.name + ' mentioned you in a post',
             read: false,
             createdAt: datetime(),
             targetId: $postId,
             targetType: 'post'
           })
           CREATE (actor)-[:TRIGGERED]->(n)-[:FOR]->(target)`,
          { userId, username, postId }
        );
      }
    }

    return NextResponse.json({ success: true, data: { id: postId } }, { status: 201 });
  } catch (error: any) {
    console.error('Create post error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error.message || 'Unknown error during post creation' 
    }, { status: 500 });
  }
}
