import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { runSingleQuery, runWriteQuery } from '@/lib/neo4j';
import { uploadFile } from '@/lib/storage';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as Record<string, unknown>)?.id as string | undefined;

    const result = await runSingleQuery<Record<string, unknown>>(
      `MATCH (u:User {id: $id})
       OPTIONAL MATCH (u)<-[:FOLLOWS]-(follower:User)
       OPTIONAL MATCH (u)-[:FOLLOWS]->(following:User)
       OPTIONAL MATCH (u)-[:CREATED]->(p:Post)
       OPTIONAL MATCH (me:User {id: $currentUserId})-[f:FOLLOWS]->(u)
       OPTIONAL MATCH (me2:User {id: $currentUserId})-[b:BLOCKED]->(u)
       OPTIONAL MATCH (u)-[fb:FOLLOWS]->(me3:User {id: $currentUserId})
       OPTIONAL MATCH (me4:User {id: $currentUserId})-[cf:CLOSE_FRIEND]->(u)
        RETURN u,
          COUNT(DISTINCT follower) AS followersCount,
          COUNT(DISTINCT following) AS followingCount,
          COUNT(DISTINCT p) AS postsCount,
          f IS NOT NULL AS isFollowing,
          b IS NOT NULL AS isBlocked,
          fb IS NOT NULL AS isFollowedBy,
          cf IS NOT NULL AS isCloseFriend`,
      { id, currentUserId: currentUserId || '' }
    );

    if (!result) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const user = result.u as Record<string, unknown>;
    delete user.password;

    return NextResponse.json({
      success: true,
      data: {
        ...user,
        followersCount: result.followersCount,
        followingCount: result.followingCount,
        postsCount: result.postsCount,
        isFollowing: result.isFollowing,
        isBlocked: result.isBlocked,
        isFollowedBy: result.isFollowedBy,
        isCloseFriend: result.isCloseFriend,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as Record<string, unknown>)?.id as string;

    if (currentUserId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const formData = await req.formData();
    const name = formData.get('name') as string | null;
    const bio = formData.get('bio') as string | null;
    const website = formData.get('website') as string | null;
    const location = formData.get('location') as string | null;
    const dob = formData.get('dob') as string | null;
    const privacy = formData.get('privacy') as string | null;

    let avatarUrl = undefined;
    const avatarFile = formData.get('avatar') as File | null;
    if (avatarFile && avatarFile.size > 0) {
      avatarUrl = await uploadFile(avatarFile);
    }

    await runWriteQuery(
      `MATCH (u:User {id: $id})
       SET u.name = COALESCE($name, u.name),
           u.bio = COALESCE($bio, u.bio),
           u.website = COALESCE($website, u.website),
           u.location = COALESCE($location, u.location),
           u.dob = COALESCE($dob, u.dob),
           u.avatar = COALESCE($avatarUrl, u.avatar),
           u.privacy = COALESCE($privacy, u.privacy),
           u.updatedAt = datetime()`,
      { id, name, bio, website, location, dob, avatarUrl, privacy }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    const currentUserId = (session?.user as Record<string, unknown>)?.id as string;

    if (currentUserId !== id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await runWriteQuery('MATCH (u:User {id: $id}) DETACH DELETE u', { id });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
